# dometeor
Domotic interface in the cloud

# How to install
Sensor side compatibility is provided only for raspberry pi (up to now).

To install it copy anti_client.py to /opt/meteoranti and create to configuration files .config and .sensors.

Now you can start the service by launching anti-client.py as root.

# How to setup start at boot

Copy the file "meteoranti" to /etc/init.d and execute the following command:

- update-rc.d meteoranti defaults