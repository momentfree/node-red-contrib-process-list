# node-red-contrib-process-list
Simple node to get information about running processes/tasks on server hosting Node-Red. It's based on [Process-list](https://www.npmjs.com/package/process-list) module.

## Install
Install from PALETTE Manager or run the following command in your NODE-RED user directory typically: \~/.node-red
```
npm install node-red-contrib-process-list
```
## Usage
Use the editor to filter output with search string (`value`) against specified property (`property`). 
Process details are returned in output array when propery's value contains search term. You can specify a search term with `msg.tasksearch` input property also.
`property` must be selected using the editor. Default is `name and cmdline`. If at least one of these 2 property's value contains search term the process will be returned in output array.
To get info on a specific process use editor and configure a filter based on property value.
example -get processes witch `name` or `cmdline` contains the search term: node.
![Editor image](documentation/process-list-editor-1.png "Editor image")
gives the output
![Editor image](documentation/process-list-flow-1.png "Flow image")

Cascade filters are available when 2 or more nodes are join together.
example - lets add second node to filter results from the first searching the `value` '/bin/dash' in the `property` path.
![Editor image](documentation/process-list-editor-2.png "Editor image")
gives the output
![Editor image](documentation/process-list-flow-2.png "Flow image")
Do not self join the node (using link in/out nodes) to avoid memory leaks.

### Input
`msg.tasksearch` string term used to filter processes overwriting `value` specified in the editor. It is case insensitive. To get all processes do not use the input and leave editor field `value` empty.
`msg.processlist` is array of objects used internally to cascade filter processes. Join together multiple node to apply more filters.
### Output
`msg.processlist` array of objects containing the following properties: `pid, name, cmdline, ppid, path, threads, owner, priority, starttime, vmem, pmem, cpu, utime, stime`.
`msg.processlistJSON` JSON array of objects.

Tested on raspbian 10 - 32bit. Should work on all Linux distro and Windows 7 and earlier.