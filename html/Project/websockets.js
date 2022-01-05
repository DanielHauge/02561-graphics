const ProjectSockets = {

    OnAccelerationRead: null,
    OnOrientationRead: null,
    OnAlign: null,
    Socket: null,

    makeObserverId: () => {
        var result = '';
        var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        for (var i = 0; i < 3; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    },

    error: msg => {
        const sensorError = document.getElementById("sensor-error");
        sensorError.innerHTML = msg;
        sensorError.hidden = true;
        console.error(msg);
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

        ProjectSockets.Socket = io({ transports: ['websocket'] });
        const urlParams = new URLSearchParams(window.location.search);
        const connectionId = urlParams.get('id');

        console.log(connectionId)
        ProjectSockets.Socket.emit("event", { id: connectionId, type: "connection", value: "null" }, (result => {
            console.log(result);
            if (result == "OK" && connectionId != null) {
                changeConLabel("Connected to: " + connectionId, true);
            } else {
                changeConLabel("Could not establish connection, it might be occupied or the url is typed in wrong, try to refresh the browser on the computer and make sure the url is correct.", false);
            }
        }))

        let orientationSensor = null;
        let accelerationSensor = null;
        ProjectSockets.errorFunc = ProjectSockets.error;
        ProjectSockets.Socket.emit("event", { id:connectionId, type: "error", value: "init"})
        document.getElementById("controller-reset").addEventListener("click", ev => {
            ProjectSockets.Socket.emit("event", { id:connectionId, type: "error", value: "reset"})
            try {
                if (orientationSensor !== null){
                    ProjectSockets.Socket.emit("event", { id:connectionId, type: "error", value: "test"})
                    ProjectSockets.Socket.emit("event", { id:connectionId, type: "align", value: JSON.stringify(orientationSensor.quaternion)});
                } else{
                    ProjectSockets.Socket.emit("event", { id:connectionId, type: "align", value: "null"});
                }
            } catch (error) {
                ProjectSockets.Socket.errorFunc(error)
            }
            
        })

        document.getElementById("controller-init").addEventListener("click", ev => {
            try {
                // orientationSensor = new AbsoluteOrientationSensor({ frequency: 60 });
                orientationSensor = new AbsoluteOrientationSensor({ frequency: 60, referenceFrame: 'device' });
                // orientationSensor = new RelativeOrientationSensor({ frequency: 60 });

                orientationSensor.addEventListener('error', error => {
                    if (error.name == 'NotReadableError') {
                        ProjectSockets.errorFunc("Sensor not available");
                    } else{
                        ProjectSockets.errorFunc(error.error.message);
                    }
                });
                
                orientationSensor.addEventListener('reading', ev => {
                    document.getElementById("sensor-info-ori-x").innerHTML = "x: " + orientationSensor.quaternion[0]
                    document.getElementById("sensor-info-ori-y").innerHTML = "y: " + orientationSensor.quaternion[1]
                    document.getElementById("sensor-info-ori-z").innerHTML = "z: " + orientationSensor.quaternion[2]
                    document.getElementById("sensor-info-ori-w").innerHTML = "w: " + orientationSensor.quaternion[3]
                    ProjectSockets.Socket.emit("event", { id: connectionId, type: "orientation", value: JSON.stringify(orientationSensor.quaternion)})
                });

                accelerationSensor = new LinearAccelerationSensor({frequency: 60});
                accelerationSensor.addEventListener('error', error => {
                    if (error.name == 'NotReadableError') {
                        ProjectSockets.errorFunc("Sensor not available");
                    } else{
                        ProjectSockets.errorFunc(error.error.message);
                    }
                })

                accelerationSensor.addEventListener('reading', () => {
                    document.getElementById("sensor-info-acc-x").innerHTML = "x: " + accelerationSensor.x;
                    document.getElementById("sensor-info-acc-y").innerHTML = "y: " + accelerationSensor.y;
                    document.getElementById("sensor-info-acc-z").innerHTML = "z: " + accelerationSensor.z;
                    const acceleration = {x:accelerationSensor.x, y:accelerationSensor.y, z:accelerationSensor.z};
                    ProjectSockets.Socket.emit("event", { id: connectionId, type: "acceleration", value: JSON.stringify(acceleration)});
                  });
                
                orientationSensor.start();
                accelerationSensor.start();
                document.getElementById("sensor-success").hidden = false;
                document.getElementById("controller-init").hidden = true;
                document.getElementById("controller-reset").hidden = false;
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
                    ProjectSockets.errorFunc(error);
                }
                ev.target.hidden = true;
            }
        })



    },

    initWebsockets: () => {
        ProjectSockets.Socket = io({ transports: ['websocket'] });
        const observerId = ProjectSockets.makeObserverId();
        ProjectSockets.Socket.emit("init-observer", observerId);
        const link = document.getElementById("connection-link");
        link.href = "../c?id=" + observerId;
        link.innerHTML = "grafik.feveile-hauge.dk/c?id=" + observerId;

        ProjectSockets.Socket.on("connection", () => {
            document.getElementById("connection-status").innerHTML = "Connected to phone";
        });

        ProjectSockets.Socket.on("disconnection", () => {
            document.getElementById("connection-status").innerHTML = "No connections";
        });

        ProjectSockets.Socket.on("orientation", orientationArray => {
            let quaternion = JSON.parse(orientationArray);
            if (ProjectSockets.OnOrientationRead != null){
                ProjectSockets.OnOrientationRead(quaternion);
            }
        });

        ProjectSockets.Socket.on("acceleration", acc => {
            let acceleration = JSON.parse(acc);
            if (ProjectSockets.OnAccelerationRead != null){
                ProjectSockets.OnAccelerationRead(acceleration);
            }
        });

        ProjectSockets.Socket.on("align", acc => {
            if (acc === "null"){
                console.error("Cannot align before sensors are started");
                return;
            }
            let align = JSON.parse(acc);
            console.log("hygge");
            if (ProjectSockets.OnAlign != null){
                ProjectSockets.OnAlign(align);
            }
        })

        ProjectSockets.Socket.on("error", err => {
            console.log(err);
        })

    },
}