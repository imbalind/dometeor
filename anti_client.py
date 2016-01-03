#! /usr/bin/env python

import os
import sys
import RPi.GPIO as GPIO
import Adafruit_DHT
import time
import yaml
import logging
from MeteorClient import MeteorClient



# Sensor interrupt callback
def my_callback(channel):
    global client
    logging.warning('Channel: '+ str(channel) + ' Time: ' + time.ctime())
    client.call('addEvent',[channel,True])



# Temperature sensor reading
def readTemp(sensor):
    global client
    channel = sensor.get('channel')
    model = Adafruit_DHT.DHT11
    humidity, temperature = Adafruit_DHT.read_retry(model, channel)

    # Note that sometimes you won't get a reading and
    # the results will be null (because Linux can't
    # guarantee the timing of calls to read the sensor).  
    # If this happens try again!
    if humidity is not None and temperature is not None:
        logging.warning('Channel: '+str(channel) + ' Time: ' + time.ctime() + ' Temperature: ' + str(temperature) + ' Humidity: ' + str(humidity))
        client.call('addEvent', [channel, 'Temp: ' + str(temperature) + 'C Humidity: ' + str(humidity) + '%'])
    else:
        logging.error('Error reading temp at channel: '+str(channel) + ' Time: ' + time.ctime())
    


# Function to filter only interrupting sensors
def getInterruptingOnly(sensor):
    return sensor.get('type') == 'antitheft'



# Function to filter only temperature sensors
def getTemperatureOnly(sensor):
    return sensor.get('type') == 'temp'



# Register connection to start alarm on connection closed
def onConnected():
    logging.info ('Login...')
    client.login(username,password)
    logging.info ('Registering connection - starting')
    client.call('registerAlarmConnection',[])
    logging.info ('Registering connection - done')
  
    
    
# Register sensor callback
def registerSensorCallback(sensor):
    channel = sensor.get('channel')
    name = sensor.get('sensor')
    logging.info ('Setting callback for channel: ' + str(channel) + ' - ' + str(name))
    GPIO.setup(channel, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
    GPIO.add_event_detect(channel, GPIO.RISING, callback=my_callback, bouncetime=1000)

# Changing directory
os.chdir(os.path.dirname(sys.argv[0]))



# Setting up logging
logging.basicConfig(filename='info.log',level=logging.INFO,format='%(asctime)s - %(levelname)s - %(message)s')



# Loading configurations
logging.info ('Loading configurations')
try:
    configFile = open('.config')
    
except IOError:
    logging.error ('No .config file!')
    exit()

config = yaml.safe_load(configFile)
if config is None:
    logging.error ('.config file is empty')
    exit()

host = config.get('host')
username = config.get('username')
password = config.get('password')
pollingTime = config.get('pollingTime') or 100

if host is None or username is None or password is None:
    logging.error ('Host, username or password are missing in .config file')
    exit()

    

# Loading sensors
logging.info ('Loading sensors')
try:
    sensorsFile = open('.sensors')
    
except IOError:
    logging.error ('No .sensors file!')
    exit()
    
sensors = yaml.safe_load(sensorsFile)
if sensors is None:
    logging.error ('.sensors file is empty')
    exit()
    
sensorList = sensors.get('sensors')
username = config.get('username')
password = config.get('password')

if not sensorList:
    logging.error ('No sensor defined in .sensors')
    exit()

    
    
# Begin main application
logging.info ('Setting meteor service')
global client
client = MeteorClient(host)
logging.info ('Connecting to service')
client.connect()
client.on('connected', onConnected)
client.on('reconnected', onConnected)

try:
    logging.info ('Setting GPIO and start listening to sensors')
    GPIO.setmode(GPIO.BCM)
    for sensor in filter(getInterruptingOnly,sensorList):
        registerSensorCallback(sensor)

    while True:
        for sensor in filter(getTemperatureOnly, sensorList):
            readTemp(sensor)
        time.sleep(pollingTime)
        
except KeyboardInterrupt:
    GPIO.cleanup()
    client.logout()
    client.close()
    logging.warning ('Exiting after cleanup!')
