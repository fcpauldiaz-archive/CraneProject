window.addEventListener('DOMContentLoaded', function() {
    var canvas = document.getElementById('canvas');
    var elements = [];
    var actions = ['trans', 'rotate', 'scale', 'shear'];
    var dimensions = ['x', 'y', 'z'];
    var objects3D = ["Boat", "Claw"];
    var actualAction = actions[0];
    var actualObject = objects3D[0];
    var engine = new BABYLON.Engine(canvas, true);
    var openDoorAudio = {};
    var closeDoorAudio = {};
    var doorIsOpen = false;
    var help = false;
    var shearX = 0;
    var shearY = 0;
    var shearZ = 0;
    var actualElement = false; //false is for boat, true for crane

    engine.enableOfflineSupport = false;

    var createScene = function() {
        var scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color3.White();
        scene.collisionsEnabled = true;

        var camera = new BABYLON.ArcRotateCamera(
            "arcCam",
            BABYLON.Tools.ToRadians(90),
            BABYLON.Tools.ToRadians(90),
            20.0,
            BABYLON.Vector3.Zero(),
            scene
        );
        camera.attachControl(canvas, true);
        camera.checkCollisions = true;

        var light = new BABYLON.PointLight(
            "PointLight",
            new BABYLON.Vector3(0, 0, 0),
            scene
        );

        light.parent = camera;
        light.intensity = 1.5;
        BABYLON.SceneLoader.ImportMesh(
            "", "", "model/boat.babylon",
            scene,
            function(newMeshes) {
                newMeshes.forEach(
                    function(mesh) {
                        elements.push(mesh);
                    }
                );
            }
        );

        elements.forEach(function(element) {
            element.checkCollisions = true;
        });

        scene.registerBeforeRender(function() {});

        return scene;
    }

    var scene = createScene();
    scene.actionManager = new BABYLON.ActionManager(scene);
    var rotate = function(mesh) {
        scene.actionManager.registerAction(new BABYLON.IncrementValueAction(BABYLON.ActionManager.OnEveryFrameTrigger, mesh, "rotation.y", 0.01));
    }

    var onKeyDown = function(evt) {


        //W
        if (evt.keyCode == 87) {
            if (actualElement === true) {
                 rotateElements(elements.filter(getCrane)[0], BABYLON.Axis.Y, -Math.PI / 12);
            }
            else {
                var transVector = new BABYLON.Vector3(1, 0, 0);
                translateElements(elements[0], transVector);
            }
        }

        //S
        if (evt.keyCode == 83) {
            if (actualElement === true) {
                rotateElements(elements.filter(getCrane)[0], BABYLON.Axis.Y, Math.PI / 12);
            }
            else {
                var transVector = new BABYLON.Vector3(-1, 0, 0);
                console.log(elements);
                translateElements(elements.filter(getBoat)[0], transVector);
            }
        }

        //A
        if (evt.keyCode == 65) {
            if (actualElement === true) {
                rotateElements(elements.filter(getClaw)[0], BABYLON.Axis.Y, Math.PI / 12);
            } else {
                rotateElements(elements.filter(getBoat)[0], BABYLON.Axis.Y, -Math.PI / 16);
            }
        }

        //D
        if (evt.keyCode == 68) {
            if (actualElement === true) {
                rotateElements(elements.filter(getClaw)[0], BABYLON.Axis.Y, -Math.PI / 12);
            }
            else {
                rotateElements(elements.filter(getBoat)[0], BABYLON.Axis.Y, Math.PI / 16);
            }
        }

    

        //help
        if (evt.keyCode == 57) {
            var helpBlock = document.getElementById('helpBlock');
            var canvas = document.getElementById('canvasBlock');

            if (help) {
                helpBlock.style.display = 'none';
                canvas.style.display = 'block';
            } else {
                helpBlock.style.display = 'block';
                canvas.style.display = 'none';
            }

            help = !help;
        }

        console.log(evt.keyCode);
    };

    var wireFrame = function(elements) {
        elements.forEach(function(e) {
            if (e.material != null) {
                e.material.wireframe = true;
            }
        });
    };

    var points = function(elements) {
        elements.forEach(function(e) {
            if (e.material != null) {
                e.material.pointsCloud = true;
                e.material.pointSize = 5;
            }
        });
    };

    var render = function(elements) {
        elements.forEach(function(e) {
            if (e.material != null) {
                e.material.pointsCloud = false;
                e.material.wireframe = false;
            }
        });
    };

    var translateElements = function(element, vector) {
        element.translate(vector, 1.0, BABYLON.Space.LOCAL);
    };

    var rotateElements = function(element, vector, factor) {
        element.rotate(vector, factor, BABYLON.Space.LOCAL);
    };

    var scaleElements = function(element, dimension, factor) {
        switch (dimension) {
            // In x
            case dimensions[0]:
                element.scaling.x = element.scaling.x * factor;
                break;
                // In y
            case dimensions[1]:
                element.scaling.y = element.scaling.y * factor;
                break;
                // In z
            case dimensions[2]:
                element.scaling.z = element.scaling.z * factor;
                break;
        }
    };

    function getClaw(item) {
        return item.id === "Claw";
    }

    function getCrane(item) {
        return item.id === "Crane";
    }

    function getBoat(item) {
        return item.id === "Boat";
    }



    // On key up, reset the movement
    var onKeyUp = function(evt) {
        if (evt.keyCode == 67) {
            actualElement = !actualElement;
        }
    }

    // Register events with the right Babylon function
    BABYLON.Tools.RegisterTopRootEvents([{
        name: "keydown",
        handler: onKeyDown
    }, {
        name: "keyup",
        handler: onKeyUp
    }]);

    engine.runRenderLoop(function() {
        scene.render();
    });
});