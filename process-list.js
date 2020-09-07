module.exports = function(RED) {
	"use strict";

	const propertiesArray = ['pid', 'name','cmdline','ppid','path','threads','owner','priority','starttime','vmem','pmem','cpu','utime','stime'];
	const propertiesToRetrieve = new Set(['pid', 'name','cmdline','ppid','path','threads','owner','priority','starttime','vmem','pmem','cpu','utime','stime']);
	const {snapshot} = require("process-list");
	/*
	the node uses Process-List module made by:

	Copyright (c) 2014 Dmitry Tsvettsikh

	Permission is hereby granted, free of charge, to any person
	obtaining a copy of this software and associated documentation
	files (the "Software"), to deal in the Software without
	restriction, including without limitation the rights to use,
	copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the
	Software is furnished to do so, subject to the following
	conditions:

	The above copyright notice and this permission notice shall be
	included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
	EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
	OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
	NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
	HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
	WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
	FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
	OTHER DEALINGS IN THE SOFTWARE.

	repositories:
	https://www.npmjs.com/package/process-list
	https://github.com/reklatsmasters/node-process-list
	*/

	// Validation Field Array



	async function taskListRequest(node,msg,callback){
		try {
			node.status({fill:"blue",shape:"dot",text:"getting tasks.."});
			var taskArray;
			if(node.processlist) { // next cascade filter
				taskArray= node.processlist;
				node.processlist="";
				// validate array object properties
				taskArray.forEach(function (arrayItem) {
					for (var i = 0; i < propertiesArray.length; i++) {
						if (typeof arrayItem[propertiesArray[i]] === 'undefined') {
							throw "Error: invalid input array format!";
						}
					}
				});
			} else { // first or single filter
				taskArray = await snapshot(...propertiesToRetrieve);
			}
			node.tasks = [];
			if(node.taskquery){
				switch(node.searchfield) {
					case "name&cmdline":
						node.tasks = taskArray.filter(task => task.name.toLowerCase().indexOf(node.taskquery.toLowerCase()) !== -1 ||
																													task.cmdline.toLowerCase().indexOf(node.taskquery.toLowerCase()) !== -1);
						break;
					case "pid": case "owner": case "name": case "cmdline": case "ppid": case "path": case "starttime":
						node.tasks = taskArray.filter(task => task[node.searchfield].toString().toLowerCase().indexOf(node.taskquery.toLowerCase()) !== -1);
						break;
					default:
						node.tasks = taskArray.filter(task => task.name.toLowerCase().indexOf(node.taskquery.toLowerCase()) !== -1 ||
																													task.cmdline.toLowerCase().indexOf(node.taskquery.toLowerCase()) !== -1);
				}
			} else {
				node.tasks=taskArray;
			}
			if(node.tasks.length===0) node.tasks="";
			callback();
		} catch (e) {
			callback(e);
			return;
		}
	}

	function ProcessListNode(config) {
			RED.nodes.createNode(this,config);
			var node = this;
			var taskname = config.taskname; // string search from editor and input
			var searchfield = config.searchfield; // property from editor only
			var jsonformat=config.jsonformat; // flag from editor only

			node.on('input', function(msg) {
					node.jsonformat = jsonformat || false;
					// get search field from editor or set to name&cmdline
					node.searchfield = searchfield || "name&cmdline";
					// get search text from input or from editor or set to empty
					if (typeof msg.tasksearch === 'string' || msg.tasksearch instanceof String){
						node.taskquery = msg.tasksearch || taskname || "";
					}else {
						node.taskquery = "";
					}
					delete msg.tasksearch;
					// get input array for cascade filters
					node.processlist = msg.processlist;
					delete msg.processlist;
					// reset JSON list
					delete msg.processlistJSON;
					// async query processes with callback
					taskListRequest(node,msg,function(err) {
							if (err) {
								node.status({fill:"red",shape:"dot",text:"error"});
								node.error(err,msg);
							} else {
								// Query Successfull. Output processlist
								RED.util.setMessageProperty(msg,"processlist",node.tasks);
								if(node.jsonformat && node.tasks){ // object array to json array
									var jsonArray = JSON.stringify({ ...node.tasks });
									RED.util.setMessageProperty(msg,"processlistJSON",jsonArray);
								}
								node.send(msg);
								// reset node status
								node.status({});
							}
					});
			});
	}
	RED.nodes.registerType("process-list",ProcessListNode,{
	});
}
