# Remote Server Setup Guide

For this project, a running instance has already been set up on the LRZ Server @10.195.8.102. 
The intended use is for each individual service (i.e. (1) the node-server (aka. frontend), (2) the django server (backend), and (3) the weaviate database) to run in a serperate linux screen. 

This guide covers the steps to connect to the remote server, run services within Linux `screen` sessions, and establish an SSH tunnel to securely access the services.

## Connecting to the SSH Server

To connect to the remote server via SSH, use the following command:

```bash
ssh -i key.pem sebalab@10.195.8.102
```

Alternativley, replace `key.pem` with the path to the private key file.

## Introduction to Linux `screen`

`screen` is a terminal multiplexer that allows you to use multiple terminal sessions inside a single window. It's useful for running long-running processes without maintaining an active SSH session.

Here are some basic `screen` commands:

- To start a new screen session with a name, use:
```bash
  screen -S [screenName]
```

- To list current screen sessions, use:
```bash
  screen -ls
  ```

Sample output:

```bash
  There are screens on:
      37470.dataUpload  (01/16/24 18:23:35)  (Detached)
      22510.weaviate    (01/16/24 14:22:15)  (Detached)
      22411.node        (01/16/24 14:20:06)  (Detached)
      22266.django      (01/16/24 14:12:25)  (Detached)
  4 Sockets in /run/screen/S-sebalab.
```

- To resume a detached screen session, use:
```bash
  screen -r [screenName]
```

- To detatch from an active session, press CRTL+A, then D

## Starting Services

Each service should be run in its own Linux screen to ensure they continue running independently:

1. **Django Service**: Refer to the [Django service startup guide](https://gitlab.lrz.de/sebanswers/app/-/tree/main/backend/django).
2. **Node Service**: Refer to the [Node service startup guide ](https://gitlab.lrz.de/sebanswers/app/-/tree/main/frontend).
3. **Weaviate Service**: Refer to the [Weaviate service startup guide](https://gitlab.lrz.de/sebanswers/app/-/tree/main/backend/weaviate).

To start a service, you would:

- Create or reattach to a screen session.
- Run the service within that screen.
- Detach from the screen, leaving the service running.

## Establishing an SSH Tunnel

LRZ has not opened access to any additional ports. Therefore, in order to bypass firewall restrictions, all traffic to your machine can betunneled through the allowed SSH connection.

To securely access the remote services, set up an SSH tunnel:

```bash
ssh -i ssh/key.pem -L [PORT_A]:localhost:[PORT_B] sebalab@10.195.8.102
```

This command forwards the local port specified in ```PORT_A``` to the remote server's port ```PORT_B```, while this SSH session is active.

I.e. when you want to connect any of the services from the outside, replace ```PORT_A``` and ```PORT_B``` with the desired port, which can be found in the resp. configuration (originally, the node server runs on port 8080, while the django server runs on port).