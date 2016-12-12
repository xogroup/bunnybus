#!/usr/bin/env bash

TEST_MODE=test
DEBUGTEST_MODE=debugtest
TRAVISBUILD_MODE=travisbuild
MODE=$TEST_MODE

#parse argument list
while [[ $# > 0 ]]
do
	ARG=$1

	case $ARG in
	-t|--test) MODE=$TEST_MODE ;;
	-dt|--debugtest) MODE=$DEBUGTEST_MODE ;;
	-tb|--travistest) MODE=$TRAVISBUILD_MODE ;;
	esac

	shift
done

#set pwd
cd /opt/app/current

#echo out environment variables we care about
echo APPLICATION_VARIABLES
echo NODE_ENV=$NODE_ENV

waitOnResources()
{
	#check for port on rabbit box
	while ! nc -z rabbit 5672; do
		sleep 1
		echo WAITING FOR rabbit:5672
	done
}

#execution based on argument
if [ $MODE == $TEST_MODE ]; then
	waitOnResources
	echo RUNNING TEST
	make test
elif [ $MODE == $DEBUGTEST_MODE ]; then
	waitOnResources
	echo RUNNING DEBUG BUILD
	make debug-test
elif [ $MODE == $TRAVISBUILD_MODE ]; then
	waitOnResources
	echo RUNNING TRAVIS BUILD
	make travis-build
fi