#!/bin/sh

cd .stack/

DEPLOY_BUCKET_S3=$(jq -r '.pipeline.deploy."s3-bucket"' config.json)
DEPLOY_PREFIX=$(jq -r '.pipeline.deploy."prefix"' config.json)
DEPLOY_CAPABILITIES=$(jq -r '.pipeline.deploy."capabilities"' config.json)
DEPLOY_BUCKET_CONFIG=$(jq -r '.pipeline.deploy."aws-config-bucket"' config.json)
DEPLOY_AWS_DEFAULT_REGION=$(jq -r '.pipeline.deploy."aws-default-region"' config.json)
DEPLOY_STACK_NAME=$(jq -r '.pipeline.deploy."stack-name"' config.json)
PROJECT_KEY=$(jq -r '.pipeline.project."project-key"' config.json)

echo "DEPLOY_BUCKET_S3: $DEPLOY_BUCKET_S3"
echo "DEPLOY_PREFIX: $DEPLOY_PREFIX"
echo "DEPLOY_CAPABILITIES: $DEPLOY_CAPABILITIES"
echo "DEPLOY_BUCKET_CONFIG: $DEPLOY_BUCKET_CONFIG"
echo "DEPLOY_AWS_DEFAULT_REGION: $DEPLOY_AWS_DEFAULT_REGION"
echo "DEPLOY_STACK_NAME: $DEPLOY_STACK_NAME"
echo "PROJECT_KEY: $PROJECT_KEY"
echo "DOCKER_TAG (GENERATED_FROM_BUILD): $DOCKER_TAG"



if ! aws cloudformation describe-stacks --region $DEPLOY_AWS_DEFAULT_REGION --stack-name $DEPLOY_STACK_NAME > /dev/null ; then
    echo "Stack $DEPLOY_STACK_NAME does not exist, packaging template..."
    jq -r '.pipeline.deploy."parameters"' config.json > parameters.json
    json=$(cat parameters.json)
    new_object='{"ParameterKey": "DockerTag", "ParameterValue": "'$DOCKER_TAG'"}'
    updated_json=$(echo "$json" | jq '. + ['"$new_object"']')
    echo "$updated_json" > parameters.json
    aws cloudformation package --template-file ../template.yaml --s3-bucket "$DEPLOY_BUCKET_S3/$DEPLOY_PREFIX" --output-template-file out.yaml
    aws cloudformation create-stack  \
    --region $DEPLOY_AWS_DEFAULT_REGION \
    --stack-name $DEPLOY_STACK_NAME \
    --capabilities $DEPLOY_CAPABILITIES \
    --template-body file://out.yaml \
    --parameters file://parameters.json

    echo "Waiting for stack $DEPLOY_STACK_NAME to be created ..."
    aws cloudformation wait stack-create-complete --region $DEPLOY_AWS_DEFAULT_REGION --stack-name $DEPLOY_STACK_NAME


else
    echo "Stack $DEPLOY_STACK_NAME exists, updating ..."
    jq -r '.pipeline.deploy."parameters"' config.json > parameters.json
    json=$(cat parameters.json)
    new_object='{"ParameterKey": "DockerTag", "ParameterValue": "'$DOCKER_TAG'"}'
    updated_json=$(echo "$json" | jq '. + ['"$new_object"']')
    echo "$updated_json" > parameters.json
    aws cloudformation package --template-file ../template.yaml --s3-bucket "$DEPLOY_BUCKET_S3/$DEPLOY_PREFIX" --output-template-file out.yaml
  set +e
  update_output=$( aws cloudformation update-stack \
    --region $DEPLOY_AWS_DEFAULT_REGION \
    --stack-name $DEPLOY_STACK_NAME \
    --capabilities $DEPLOY_CAPABILITIES \
    --template-body file://out.yaml \
    --parameters file://parameters.json 2>&1)
  status=$?
  set -e

  echo "$update_output"

  if [ $status -ne 0 ] ; then

    # Don't fail for no-op update
    if [[ $update_output == *"ValidationError"* && $update_output == *"No updates"* ]] ; then
      echo -e "\nFinished create/update - no updates to be performed"
      exit 0
    else
      exit $status
    fi

  fi

  echo "Waiting for stack update to complete ..."
  aws cloudformation wait stack-update-complete \
    --region $DEPLOY_AWS_DEFAULT_REGION \
    --stack-name $DEPLOY_STACK_NAME

fi

echo "********"
echo "Finished create/update successfully!"