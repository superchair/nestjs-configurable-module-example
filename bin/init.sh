#!/bin/sh

# Query ECS Task Metadata endpoint only if available
if [ -n "$ECS_CONTAINER_METADATA_URI_V4" ]; then
	METADATA_URL="${ECS_CONTAINER_METADATA_URI_V4}/task"
	METADATA_JSON=$(curl -s "$METADATA_URL")
	if [ $? -eq 0 ] && [ -n "$METADATA_JSON" ]; then
		export AWS_REGION=$(echo "$METADATA_JSON" | jq -r '.AvailabilityZone' | sed 's/[a-z]$//')
		export AWS_ECS_CLUSTER_NAME=$(echo "$METADATA_JSON" | jq -r '.Cluster')
		export AWS_ECS_SERVICE_NAME=$(echo "$METADATA_JSON" | jq -r '.ServiceName')
		export AWS_ECS_TASK_DEFINITION=$(echo "$METADATA_JSON" | jq -r '.Family')
		export AWS_ECS_TASK_ARN=$(echo "$METADATA_JSON" | jq -r '.TaskARN')
		echo "AWS_REGION=$AWS_REGION"
		echo "AWS_ECS_CLUSTER_NAME=$AWS_ECS_CLUSTER_NAME"
		echo "AWS_ECS_SERVICE_NAME=$AWS_ECS_SERVICE_NAME"
		echo "AWS_ECS_TASK_DEFINITION=$AWS_ECS_TASK_DEFINITION"
		echo "AWS_ECS_TASK_ARN=$AWS_ECS_TASK_ARN"
	else
		echo "ECS metadata endpoint unavailable or curl failed; skipping ECS env setup."
	fi
else
	echo "ECS_CONTAINER_METADATA_URI_V4 not set; skipping ECS env setup."
fi