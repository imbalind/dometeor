import RPi.GPIO as GPIO
import time
import yaml
from MeteorClient import MeteorClient

# Sensor interrupt callback
def my_callback(channel):
    global client
    print('Channel: '+ str(channel) + ' Time: ' + time.ctime())
    client.call('addEvent',[channel,True])

# Function to filter only interrupting sensors
def getInterruptingOnly(sensor):
   return sensor.get('type') == 'antitheft'

# Loading configurations
print 'Loading configurations'
try:
    configFile = open('.config')
except IOError:
    print 'No .config file!'
    exit()

config = yaml.safe_load(configFile)
if config is None:
    print '.config file is empty'
    exit()

host = config.get('host')
username = config.get('username')
password = config.get('password')

if host is None or username is None or password is None:
    print 'Host, username or password are missing in .config file'
    exit()


# Loading sensors
print 'Loading sensors'
try:
    sensorsFile = open('.sensors')
except IOError:
    print 'No .sensors file!'
    exit()

sensors = yaml.safe_load(sensorsFile)
if sensors is None:
    print '.sensors file is empty'
    exit()

sensorList = sensors.get('sensors')
username = config.get('username')
password = config.get('password')

if not sensorList:
    print 'No sensor defined in .sensors'
    exit()



# Begin main application
global client
client = MeteorClient(host)
print 'Connecting to service'
client.connect()
print 'Login...'
client.login(username,password)
print 'Registering connection - starting'
client.call('registerAlarmConnection',[]);
print 'Registering connection - done'

try:

    print 'Setting GPIO and start listening to sensors'
    GPIO.setmode(GPIO.BCM)

    for sensor in filter(getInterruptingOnly,sensorList):
      channel = sensor.get('channel')
      name = sensor.get('sensor')
      print 'Setting callback for channel: ' + str(channel) + ' - ' + str(name) 
      GPIO.setup(channel, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
      GPIO.add_event_detect(channel, GPIO.RISING, callback=my_callback, bouncetime=300)

    while True:
        time.sleep(100)
except KeyboardInterrupt:
    GPIO.cleanup()
    client.logout()
    client.close()
    print 'Exiting after cleanup!'
