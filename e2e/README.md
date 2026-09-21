# Maestro flows

Install Maestro, then run against a running emulator or device:

```bash
maestro test e2e/
```

The flows cover the five happy paths plus the two states store review checks:
location denied (`04`) and offline (`05`). `06` walks the Today → Tips path and
is the flow to re-run with the OS font scale at 200%. `07` drops a pin, saves
it under a new name and lands on its forecast. `08` opens a route to the water
in the phone's own maps app — it leaves the app, so run it last.
