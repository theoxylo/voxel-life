#!/bin/sh

chown -R toneill *
chgrp -R root *

find . -type f | sed /\ /d | xargs chmod 644
find . -type d | sed /\ /d | xargs chmod 755
