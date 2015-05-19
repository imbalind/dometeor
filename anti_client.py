import RPi.GPIO as GPIO
import time
from MeteorClient import MeteorClient


def my_callback(channel):
    global client
    print('Channel: '+ str(channel) + ' Time: ' + time.ctime())
    status = client.find_one("status");
    if status.get("isOn"):
        client.call("addEvent",[channel,True]);

client = MeteorClient('ws://meteoranti.meteor.com/websocket')
client.connect()
client.login(<username>,<password>)
client.subscribe("status");

GPIO.setmode(GPIO.BCM)
GPIO.setup(24, GPIO.IN, pull_up_down=GPIO.PUD_DOWN)
GPIO.add_event_detect(24, GPIO.RISING, callback=my_callback, bouncetime=300)

try:
    while True:
        time.sleep(100)
except KeyboardInterrupt:
    GPIO.cleanup()
    client.logout()
    client.close()
    print "Exiting after cleanup!"
