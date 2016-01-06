Events = new Mongo.Collection("events");
Status = new Mongo.Collection("status");
Links = new Mongo.Collection("links");

if (Meteor.isClient) {
  // This code only runs on the client
    
    Meteor.subscribe("events");
	Meteor.subscribe("status");
    Meteor.subscribe("links");
    Meteor.subscribe("emails");

  Template.body.helpers({
    
	alarmOn: function() {
		alarmStatus = Status.findOne({owner : Meteor.userId()});
		if (!alarmStatus) {
			return;
		}
		return alarmStatus.isOn;
	},
    isUndefined: function() {
        return Meteor.user() && Meteor.user().isAlarm === undefined;
    }, 
    alarmBtnClass: function() {
        if (Meteor.user() && Meteor.user().isAlarm) {
            return "";
        }
        return "grey lighten-2"
    }, 
    clientBtnClass: function() {
        if (Meteor.user() && Meteor.user().isAlarm===false) {
            return "";
        }
        return "grey lighten-2"
    },
    isAlarm: function() {
        return Meteor.user() && Meteor.user().isAlarm;
    }
  });
    
  Template.tabs.helpers({
    events: function() {
      
      eventChannel =  parseFloat(Session.get("event-channel"));  
      if (eventChannel || eventChannel === 0) {
        return Events.find({channel: eventChannel},{sort:{createdAt: -1},limit:10});   
      } else {
        return Events.find({},{sort:{createdAt: -1},limit:10}); 
      }
    },
    linkedAlarms: function() {
        return Links.findOne({owner: Meteor.userId()}).alarms;
    },
    linkedClients: function() {
        return Links.find({"alarms.alarmId": Meteor.userId()});
    },
    isClient: function() {
        return Meteor.user() && Meteor.user().isAlarm===false;
    },
    isAlarm: function() {
        return Meteor.user() && Meteor.user().isAlarm;
    }
  });
    
  Template.event.helpers({
    email: function() {
        return Meteor.users.findOne({_id: this.owner}).emails[0].address;
    } 
  });

  Template.linkedAlarm.helpers({
    alarmOn: function() {
		alarmStatus = Status.findOne({owner: this.alarmId});
		if (!alarmStatus) {
			return;
		}
		return alarmStatus.isOn;
	},  
    email: function() {
        return Meteor.users.findOne({_id: this.alarmId}).emails[0].address;
    } 
  });
    
    
  Template.body.events({
    "click #new_event": function (event) {
          
        Meteor.call("addEvent",0,true);     
        return false;
    },
  	"change #switch_on_off": function (e) {
		Meteor.call("turnOnOff", Meteor.userId(), e.target.checked);
	},
    "submit #add-client": function (e) {
        emailAddress = e.target.email.value;
        e.target.email.value="";
        Meteor.call("linkAlarmTo", emailAddress);
        event.preventDefault();
    },
    "click #im-alarm": function (e) {
        Meteor.call("setUserAsAlarm",true);
    },
    "click #im-client": function (e) {
        Meteor.call("setUserAsAlarm",false);
    }
  });
  
  
  Template.tabs.events({
    "keyup #event-channel": function (e) {
       Session.set("event-channel", e.target.value);
    }
  });
	
  Template.event.events({
     "click .toggle-checked": function () {
        
        Meteor.call("toggleChecked",this._id, this.checked);
          
     },
     "click #delete": function () {
        Meteor.call("deleteEvent",this._id); 
     }
  });
    
  Template.linkedAlarm.events({
     "click #delete": function () {
        Meteor.call("deleteLink",Meteor.userId(), this.alarmId); 
     },
     "change #alarm_on_off": function (e) {
		Meteor.call("turnOnOff", this.alarmId, e.target.checked);
	}
  });
    
    
  Template.linkedClient.events({
     "click #delete": function () {
        Meteor.call("deleteLink", this.owner, Meteor.userId()); 
     }
  });
    
  Template.tabs.onRendered(function(){ 

  $("ul.tabs").tabs() 

  });
  
}    

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });

    Meteor.publish("events", function() {
        link = Links.findOne({owner: this.userId});
        if(!link) {
            alarms = [this.userId];
        } else {
            alarms = link.alarms.map(function(alarm) {
                return alarm.alarmId;
            });
        }
      
      
        return Events.find({owner: {$in : alarms}},{sort:{createdAt: -1}});   
    });

	Meteor.publish("status", function() {
        link = Links.findOne({owner: this.userId});
        if(!link) {
            alarms = [this.userId];
        } else {
            alarms = link.alarms.map(function(alarm) {
                return alarm.alarmId;
            });
        }
        return Status.find({owner: {$in : alarms}});   
    });
    
    Meteor.publish("links", function() {
		return Links.find();
    });    	
    
    Meteor.publish("emails", function() {
        return Meteor.users.find({},{fields : {emails:1}});
    });
    
    Meteor.publish(null, function() {
        return Meteor.users.find({_id: this.userId},{fields : {"isAlarm":1}});
    });
}


Meteor.methods({
    
    addEvent: function (sensor_num, value) {
        
        if(! Meteor.userId()) {
            throw new Meteor.Error("not-authorized");   
        }
        
		status = Status.findOne({owner: Meteor.userId()});
		
		if(! status.isOn) {
			return;
		}
		
        
        Events.insert({
            channel: sensor_num,
            value: value,
            createdAt: new Date(),
            owner: Meteor.userId()
        });
    },
    
    toggleChecked: function(event_id, event_checked) {
        Events.update(event_id, {$set: {checked: ! event_checked}});    
    },
    
    deleteEvent: function(event_id) {
        Events.remove(event_id);    
    },
    
    deleteLink: function(client_id, alarm_id) {
        link = Links.findOne({owner : client_id});
        if (link.alarms.length <= 1) {
            Links.remove({owner : client_id});
        } else {
            Links.update({owner : client_id},{$pull:{"alarms.alarm_id" : alarm_id}});
        }
    },
	
	turnOnOff: function (userId, turnOn) {
		Status.update({owner : userId},{$set: {isOn : turnOn}}, {upsert : true});
	},
    
    registerAlarmConnection: function() {
        this.connection.onClose(function() {
            Meteor.call("addEvent",-1, "Disconnected");
        });
    },
    
    linkAlarmTo: function (ownerEmail) {
        
        alarmId = Meteor.userId();
        ownerId = Meteor.users.findOne({"emails.address":ownerEmail},{fields : {"_id":1}})._id;
        
        if(ownerId && !Links.findOne({owner: ownerId, "alarms.alarmId": alarmId})) {
            newAlarm = {};
            newAlarm.alarmId = alarmId;
            newAlarm.confirmed = false;
            Links.update({owner : ownerId}, {$addToSet: {alarms: newAlarm},$set: {email: ownerEmail}}, {upsert : true});
        }
    },
    
    setUserAsAlarm: function (isAlarm) {
        Meteor.users.update({_id:Meteor.userId()},{$set:{"isAlarm":isAlarm}},{upsert: true});
    }
})