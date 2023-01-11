# FlowForge Device Agent

This module provides an agent that runs Node-RED projects deployed from the
FlowForge platform.

## Prerequisites

 - NodeJS v16
 - A FlowForge platform instance to connect to

The agent does not support running on Windows.

## Install

The agent can be installed as a global npm module. This will ensure the agent
command is on the path:

```
npm install -g @flowforge/flowforge-device-agent
```

## Configuration

The agent configuration is provided in a `device.yml` file within its working
directory.


### Configuration directory

By default the agent uses `/opt/flowforge-device` as its working directory. 
This can be overridden with the `-d/--dir` option.

The directory must exist and be accessible to the user that will be
running the agent.

```
sudo mkdir /opt/flowforge-device
sudo chown -R $USER /opt/flowforge-device
```

### `device.yml`

When the device is registered on the FlowForge platform, a group of configuration
details are provided. These can be copied from the platform, or downloaded directly
as a yml file.

This file should be copied into the working directory as `device.yml`.

A different config file can be specified with the `-c/--config` option.

The file must contain the following options (these are the ones provided by 
FlowForge)

Required options   | Description
-------------------|---------------
`deviceId`         | The id for the device on the FlowForge platform
`token`            | Access Token to connect to the FF platform
`credentialSecret` | Key to decrypt the flow credentials
`forgeURL`         | The base url of the FlowForge platform

To enable MQTT connectivity, the following options are required. They are provided
by the platform if MQTT comms are enabled.

MQTT options   | Description
---------------|---------------
`brokerURL`      | The url for the platform broker
`brokerUsername` | The username to connect with - `device:<teamId>:<deviceId>`
`brokerPassword` | The password to connect with

The following options can be added:

Extra options   | Description
----------------|---------------
`interval`      | How often, in seconds, the agent checks in with the platform. Default: 60s
`intervalJitter`| How much, in seconds, to vary the heartbeat +/- `intervalJitter`. Default: 10s
`port`          | The port to listen on. Default: 1880
`moduleCache`   | If the device can not access npmjs.org then use the node modules cache in `module_cache` directory. Default `false`

## Running

If the agent was installed as a global npm module, the command 
`flowforge-device-agent` will be on the path.

If the default working directory and config file are being used, then the agent
can be started with:

```
$ flowforge-device-agent
```

For information about the available command-line arguments, run with `-h`:

```
Options

  -c, --config file     Device configuration file. Default: device.yml
  -d, --dir dir         Where the agent should store its state. Default: /opt/flowforge-device
  -i, --interval secs
  -p, --port number
  -m, --moduleCache     use local npm module cache rather than install

Global Options

  -h, --help       print out helpful usage information
  --version        print out version information
  -v, --verbose    turn on debugging output
```

## Running with no access to npmjs.org

By default the Device Agent will try and download the correct version of Node-RED and 
any nodes required to run the Project Snapshot that is assigned to run on the device.

If the device is being run on a offline network or security policies prevent the 
Device Agent from connecting to npmjs.org then it can be configured to use a pre-cached 
set of modules.

You can enable this mode by adding `-m` to the command line adding `moduleCache: true` 
to the `device.yml` file. This will cause the Device Agent to load the modules from the 
`module_cache` directory in the Device Agents Configuration directory as describe above.
By default this will be `/opt/flowforge-device/module_cache`.

The easiest way to create the cache is to download the `package.json` for the Snapshot. 
This can be found in the 3 dots menu for the Snapshot on the Project's Snapshot page.

Place this file in an empty directory on a machine with the same OS and architecture as 
the device and run `npm install`. This will create a `node_modules` directory which you 
should copy into `module_cache` director on the device.

## Running as a service

An example service file is provided [here](https://github.com/flowforge/flowforge-device-agent/tree/main/service).
