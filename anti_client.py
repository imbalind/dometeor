import RPi.GPIO as GPIO
import time
import yaml
from MeteorClient import MeteorClient


def my_callback(channel):
    global client
    print('Channel: '+ str(channel) + ' Time: ' + time.ctime())
    status = client.find_one('status');
    if status.get('isOn'):
        client.call('addEvent',[channel,True])

try:
    configFile = open('.config')
except IOError:
    print 'No .config file!'
    exit()

config = yaml.safe_load(configFile)
if config is None:
    print '.config file is empty'
    exit()

username = config.get('username')
password = config.get('password')

if username is None or password is None:
    print 'No username or password in .config file'
    exit()

global client
client = MeteorClient('ws://meteoranti.meteor.com/websocket')
client.connect()
client.login(username,password)
client.subscribe('status')

try:

print 'Setting GPIO and start listening to sensors'

GPIO.setmode(GPIO.BCM)
GPIO.setup(24, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
GPIO.add_event_detect(24, GPIO.RISING, callback=my_callback, bouncetime=300)

    while True:
        time.sleep(100)
except KeyboardInterrupt:
    GPIO.cleanup()
    client.logout()
    client.close()
    print 'Exiting after cleanup!'
