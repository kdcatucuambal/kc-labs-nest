#!/bin/sh
#check current branch
CURRENT_BRANCH=$(git branch --show-current)

#check if config.json exists
if [ ! -f configs/$CURRENT_BRANCH.json ]; then
    echo "ERROR: config.json not found for branch $CURRENT_BRANCH!"
    exit 1
fi

#check if .stack folder exists, if not, create it
echo "Setting workspace..."
if [ ! -d .stack ]; then
    mkdir .stack
fi

#delete all files in .stack folder
rm -rf .stack/*
cp configs/$CURRENT_BRANCH.json .stack/config.json

 
echo "Inject values.."

INIT_VARIABLES=$(python3 scripts/parameters.py)
echo $INIT_VARIABLES

cd .stack/

echo "Init variables.."

PATH_SERVICE=$(jq -r '.pipeline.project."path-service"' config.json)
AWS_ACCOUNT_ID=$(jq -r '.parameters."AwsAccountId"' config.json)
AWS_REGION=$(jq -r '.parameters."AwsRegion"' config.json)
ENVIRONMENT_ID=$(jq -r '.parameters."EnvironmentId"' config.json)
MICROSERVICE_NAME=$(jq -r '.parameters."Module"' config.json)
MICROSERVICE_PORT=$(jq -r '.pipeline.deploy.parameters[] | select(.ParameterKey=="MicroservicePort").ParameterValue' "config.json")
REPO_NAME=$(jq -r '.pipeline.docker."name"' config.json)
HASH_COMMIT=$(git rev-parse --short HEAD)
PROJECT_NAME=$ENVIRONMENT_ID-$MICROSERVICE_NAME-service
export DOCKER_TAG=$PROJECT_NAME.$HASH_COMMIT


echo "PATH_SERVICE: $PATH_SERVICE"
echo "ENVIRONMENT_ID: $ENVIRONMENT_ID"
echo "MICROSERVICE_NAME: $MICROSERVICE_NAME"
echo "PROJECT_NAME: $PROJECT_NAME"
echo "MICROSERVICE_PORT: $MICROSERVICE_PORT"
echo "HASH_COMMIT: $HASH_COMMIT"
echo "DOCKER_TAG: $DOCKER_TAG"
echo "AWS_ACCOUNT_ID: $AWS_ACCOUNT_ID"
echo "AWS_REGION: $AWS_REGION"
echo "REPO_NAME: $REPO_NAME"

cd ../

echo "Build service.."
#check if service folder exists
if [ ! -d $PATH_SERVICE ]; then
    echo "ERROR: PATH_SERVICE folder not found!"
    exit 1
fi

cd ./$PATH_SERVICE
ls -la

echo "Build docker image.."
#check if docker is running
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker is not running. Please start docker and try again."
    exit 1
fi

#check if Dockerfile exists
if [ ! -f Dockerfile ]; then
    echo "ERROR: Dockerfile not found!"
    exit 1
fi


echo "[EXEC] docker build -t $PROJECT_NAME:$HASH_COMMIT --build-arg PORT=$MICROSERVICE_PORT ."
docker build -t $PROJECT_NAME:$HASH_COMMIT --build-arg PORT=$MICROSERVICE_PORT .

echo "[EXEC] docker tag $PROJECT_NAME:$HASH_COMMIT $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com$REPO_NAME:$DOCKER_TAG"
docker tag $PROJECT_NAME:$HASH_COMMIT $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com$REPO_NAME:$DOCKER_TAG

echo "ECR Login.."
echo "[EXEC] aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

echo "Push image to ECR.."
echo "[EXEC] docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com$REPO_NAME:$DOCKER_TAG"
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com$REPO_NAME:$DOCKER_TAG


cd ../

echo "Finish build.sh successfully!"


