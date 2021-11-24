const ProjectSockets = {

    OnAccelerationRead: null,
    OnOrientationRead: null,
    Socket: null,

    makeObserverId: () => {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (var i = 0; i < 4; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    },

    error: msg => {
        const sensorError = document.getElementById("sensor-error");
        sensorError.innerHTML = msg;
        sensorError.hidden = true;
        console.error(error.error.message);
    },

    connectWebsockets: () => {

        const changeConLabel = (text, OK) => {
            const conLabel = document.getElementById("connection-status");
            conLabel.innerHTML = text;
            if (OK) {
                conLabel.classList.remove("text-danger");
                conLabel.classList.add("text-success");
            } else {
                conLabel.classList.remove("text-success");
                conLabel.classList.add("text-danger");
            }
        }

        Project.Socket = io({ transports: ['websocket'] });
        const urlParams = new URLSearchParams(window.location.search);
        const connectionId = urlParams.get('id');

        Project.Socket.emit("event", { id: connectionId, type: "connection", value: "null" }, (result => {
            if (result == "OK" && connectionId != null) {
                changeConLabel("Connected to: " + connectionId, true);
            } else {
                changeConLabel("Could not establish connection, it might be occupied or the url is typed in wrong, try to refresh the browser on the computer and make sure the url is correct.", false);
            }
        }))

        let orientationSensor = null;
        let accelerationSensor = null;

        document.getElementById("controller-init").addEventListener("click", ev => {
            try {
                orientationSensor = new AbsoluteOrientationSensor({ frequency: 60, referenceFrame: 'device' });
                orientationSensor.addEventListener('error', error => {
                    if (error.name == 'NotReadableError') {
                        ProjectSockets.errorFunc("Sensor not available");
                    } else{
                        ProjectSockets.errorFunc(error.name);
                    }
                });
                orientationSensor.addEventListener('reading', ev => {
                    // model is a Three.js object instantiated elsewhere.
                    document.getElementById("sensor-info-ori-x").innerHTML = "x: " + orientationSensor.quaternion[0]
                    document.getElementById("sensor-info-ori-y").innerHTML = "y: " + orientationSensor.quaternion[1]
                    document.getElementById("sensor-info-ori-z").innerHTML = "z: " + orientationSensor.quaternion[2]
                    document.getElementById("sensor-info-ori-w").innerHTML = "w: " + orientationSensor.quaternion[3]
                    Project.Socket.emit("event", { id: connectionId, type: "orientation", value: JSON.stringify(orientationSensor.quaternion)})
                });

                accelerationSensor = new LinearAccelerationSensor({frequency: 60});
                accelerationSensor.addEventListener('error', error => {
                    if (error.name == 'NotReadableError') {
                        ProjectSockets.errorFunc("Sensor not available");
                    } else{
                        ProjectSockets.errorFunc(error.name);
                    }
                })

                accelerationSensor.addEventListener('reading', () => {
                    document.getElementById("sensor-info-acc-x").innerHTML = "x: " + accelerationSensor.x;
                    document.getElementById("sensor-info-acc-y").innerHTML = "y: " + accelerationSensor.y;
                    document.getElementById("sensor-info-acc-z").innerHTML = "z: " + accelerationSensor.z;
                    const acceleration = {x:accelerationSensor.x, y:accelerationSensor.y, z:accelerationSensor.z};
                    Project.Socket.emit("event", { id: connectionId, type: "acceleration", value: JSON.stringify(acceleration)});
                  });
                
                orientationSensor.start();
                accelerationSensor.start();
                document.getElementById("sensor-success").hidden = false;
                document.getElementById("controller-init").hidden = true;
                document.getElementById("sensor-info-ori-label").hidden = false;
                document.getElementById("sensor-info-ori-x").hidden = false;
                document.getElementById("sensor-info-ori-y").hidden = false;
                document.getElementById("sensor-info-ori-z").hidden = false;
                document.getElementById("sensor-info-ori-w").hidden = false;
                document.getElementById("sensor-info-acc-label").hidden = false;
                document.getElementById("sensor-info-acc-x").hidden = false;
                document.getElementById("sensor-info-acc-y").hidden = false;
                document.getElementById("sensor-info-acc-z").hidden = false;

            } catch (error) {
                if (error.name === "ReferenceError"){
                    ProjectSockets.errorFunc('Sensor is not supported by the browser. It is important that a secure context is used, try access with HTTPS on an updated version of google chrome or other <a href="https://developer.mozilla.org/en-US/docs/Web/API/AbsoluteOrientationSensor#browser_compatibility"> compatible browser </a>')
                } else if (error.name === "SecurityError"){
                    ProjectSockets.errorFunc("Sensor construction was blocked by a feature policy.");
                } else{
                    ProjectSockets.errorFunc(error.name);
                }
                ev.target.hidden = true;
            }
        })



    },

    initWebsockets: () => {
        Project.Socket = io({ transports: ['websocket'] });
        const observerId = ProjectSockets.makeObserverId();
        Project.Socket.emit("init-observer", observerId);
        const link = document.getElementById("connection-link");
        link.href = "../c?id=" + observerId;
        link.innerHTML = "grafik.feveile-hauge.dk/c?id=" + observerId;

        Project.Socket.on("connection", () => {
            document.getElementById("connection-status").innerHTML = "Connected to phone";
        });

        Project.Socket.on("disconnection", () => {
            document.getElementById("connection-status").innerHTML = "No connections";
        });

        Project.Socket.on("orientation", orientationArray => {
            let quaternion = JSON.parse(orientationArray);
            if (ProjectSockets.OnOrientationRead != null){
                ProjectSockets.OnOrientationRead(quaternion);
            }
        });

        Project.Socket.on("acceleration", acc => {
            let acceleration = JSON.parse(acc);
            if (ProjectSockets.OnAccelerationRead != null){
                ProjectSockets.OnAccelerationRead(acceleration);
            }
        });

    },
}