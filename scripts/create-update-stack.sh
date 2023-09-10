#!/bin/sh
start_time=$(date +%s)
echo "STARTING BUILD..."
. ./scripts/build.sh
echo "BUILD FINISHED"
echo "STARTING DEPLOY..."
. ./scripts/deploy.sh
echo "DEPLOY FINISHED"
end_time=$(date +%s)

total_time=$((end_time - start_time))
echo "Total time: $total_time seconds"

hours=$(( total_time / 3600 ))
seconds=$(( total_time % 3600 ))
minutes=$(( total_time / 60 ))
seconds=$(( total_time % 60 ))

formatted_time=$(printf "%02d Hours : %02d Mins : %02d Secs." $hours $minutes $seconds)

echo "Finish execution: " $formatted_time