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
    var meshesColliderList = [];
    var plan2;
    var matPlan;
    var currentHoldingContainer;
    var holding = false;
    var containersWithShip = [];

    engine.enableOfflineSupport = false;

    var createScene = function() {
        var scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color3.White();
        scene.gravity = new BABYLON.Vector3(0, -9.81, 0);
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
        camera.applyGravity = true; 
        camera.ellipsoid = new BABYLON.Vector3(1, 1, 1);
        camera.checkCollisions = true;
        camera.collisionRadius = new BABYLON.Vector3(0.5, 0.5, 0.5)

        var light = new BABYLON.HemisphericLight(
            "HemisphericLight",
            new BABYLON.Vector3(0, 1, 0),
            scene
        );

        light.parent = camera;
        light.intensity = 2.0;
        BABYLON.SceneLoader.ImportMesh(
            "", "", "model/boat-and-crane.babylon",
            scene,
            function(newMeshes) {
                newMeshes.forEach(
                    function(mesh) {
                        elements.push(mesh);
                    }
                );
            }
        );


        scene.meshes.forEach(function(element) {
            element.checkCollisions = true;
            element.boundingBox = true;
        });
         
       
        scene.registerBeforeRender(function() {
            elements.forEach(function(element) {
                element.checkCollisions = true;
                element.boundingBox = true;
                //element.moveWithCollisions();
            });
        });

        // Water
        var waterMesh = BABYLON.Mesh.CreateGround("waterMesh", 512, 512, 32, scene, false);
        
        var water = new BABYLON.WaterMaterial("water", scene);
        water.bumpTexture = new BABYLON.Texture("model/water/waterbump.png", scene);

        // Ground
        var groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
        groundMaterial.diffuseTexture = new BABYLON.Texture("model/ground.jpg", scene);
        groundMaterial.diffuseTexture.uScale = groundMaterial.diffuseTexture.vScale = 4;
        
        var ground = BABYLON.Mesh.CreateGround("ground", 512, 512, 32, scene, false);
        ground.checkCollisions = true;
        ground.position.y = -11;
        ground.material = groundMaterial;

        // Water properties
        water.windForce = -15;
        water.waveHeight = 1.3;
        water.windDirection = new BABYLON.Vector2(1, 1);
        water.waterColor = new BABYLON.Color3(0.1, 0.1, 0.6);
        water.colorBlendFactor = 0.3;
        water.bumpHeight = 0.1;
        water.waveLength = 0.1;
        

        water.addToRenderList(ground);
        // Assign the water material
        waterMesh.material = water;
        waterMesh.position.y = -10;


       

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
                rotateElements(elements.filter(getClaw)[0], BABYLON.Axis.Y, -Math.PI / 12);
            }
            else {
                var transVector = new BABYLON.Vector3(0, 0, -1);
                var transVectorContainer = new BABYLON.Vector3(1, 0, 0);
                translateElements(elements.filter(getBoat)[0], transVector);
                for (var i = 0; i < containersWithShip.length; i++) {
                    var container = containersWithShip[i];
                    translateElements(container, transVectorContainer);
                }
            }
        }

        //S
        if (evt.keyCode == 83) {
            if (actualElement === true) {
                rotateElements(elements.filter(getClaw)[0], BABYLON.Axis.Y, Math.PI / 12);
                
            }
            else {
                var transVector = new BABYLON.Vector3(0, 0, 1);
                translateElements(elements.filter(getBoat)[0], transVector);
                var transVectorContainer = new BABYLON.Vector3(-1, 0, 0);
                translateElements(elements.filter(getBoat)[0], transVector);
                for (var i = 0; i < containersWithShip.length; i++) {
                    var container = containersWithShip[i];
                    translateElements(container, transVectorContainer);
                }

            }
        }

        //A
        if (evt.keyCode == 65) {
            if (actualElement === true) {
                var crane = elements.filter(getCrane)[0];
                rotateElements(crane, BABYLON.Axis.Y, Math.PI / 12);
                if (holding) {
                    var claw = elements.filter(getClaw)[0];
                    currentHoldingContainer.position.x = claw.getAbsolutePosition().x;
                    currentHoldingContainer.position.y = claw.getAbsolutePosition().y - 1.8;
                    currentHoldingContainer.position.z = claw.getAbsolutePosition().z;
                }
            } else {
                rotateElements(elements.filter(getBoat)[0], BABYLON.Axis.Y, -Math.PI / 16);
                for (var i = 0; i < containersWithShip.length; i++) {
                    var container = containersWithShip[i];
                    rotateElements(container, BABYLON.Axis.Y, -Math.PI / 16);
                }
            }
        }

        //D
        if (evt.keyCode == 68) {
            if (actualElement === true) {
                var crane = elements.filter(getCrane)[0]
                rotateElements(crane, BABYLON.Axis.Y, -Math.PI / 12);
                if (holding) {
                    var claw = elements.filter(getClaw)[0];
                    currentHoldingContainer.position.x = claw.getAbsolutePosition().x;
                    currentHoldingContainer.position.y = claw.getAbsolutePosition().y - 1.8;
                    currentHoldingContainer.position.z = claw.getAbsolutePosition().z;
                }
            }
            else {
                rotateElements(elements.filter(getBoat)[0], BABYLON.Axis.Y, Math.PI / 16);
                for (var i = 0; i < containersWithShip.length; i++) {
                    var container = containersWithShip[i];
                    rotateElements(container, BABYLON.Axis.Y, Math.PI / 16);
                }
            }
        }
        // x
        if (evt.keyCode === 88) {
            
            var claw = elements.filter(getClaw)[0];
            var rope = elements.filter(getRope)[0];
            var boat = elements.filter(getBoat)[0];
            
            var clawPosition = claw.getAbsolutePosition();
            var boatPosition = boat.getAbsolutePosition();
          /*  console.log('boat')
            console.log(boatPosition.z)
            console.log(boatPosition.x)
            console.log('claw')
            console.log(clawPosition.z)
            console.log(clawPosition.x)*/
            var center = clawPosition.x
            if ((Math.abs(clawPosition.y) -3) < Math.abs(boatPosition.y)
                && center > (boatPosition.x - 14.0) && center < (boatPosition.x + 20.77)
                ) {
                //drop on choque
                console.log('choca');
            } else {
                var transVector = new BABYLON.Vector3(0, -0.5, 0);
                var transVector2 = new BABYLON.Vector3(0, -1, 0);
                translateElements(claw,transVector2);
                scaleElements(rope, dimensions[1], 1.1);
                translateElements(rope, transVector);
            }
            if (holding) {
                var claw = elements.filter(getClaw)[0];
                currentHoldingContainer.position.x = claw.getAbsolutePosition().x;
                currentHoldingContainer.position.y = claw.getAbsolutePosition().y - 1.8;;
                currentHoldingContainer.position.z = claw.getAbsolutePosition().z;
            }
         


        }
        // z
        if (evt.keyCode === 90) {
            var claw = elements.filter(getClaw)[0];
            var rope = elements.filter(getRope)[0];
            var transVector = new BABYLON.Vector3(0, 0.6, 0);
            var transVector2 = new BABYLON.Vector3(0, 1, 0);
            translateElements(claw,transVector2);
            scaleElements(rope, dimensions[1], 0.9);
            translateElements(rope, transVector);
            if (holding) {
                var claw = elements.filter(getClaw)[0];
                currentHoldingContainer.position.x = claw.getAbsolutePosition().x;
                currentHoldingContainer.position.y = claw.getAbsolutePosition().y - 1.8;;
                currentHoldingContainer.position.z = claw.getAbsolutePosition().z;
            }
        }
        // spacebar
        if (evt.keyCode === 32) {
            //dropoff command
            if (holding) {
                if (!containersWithShip.includes(currentHoldingContainer)) {
                    containersWithShip.push(currentHoldingContainer);
                }
            }

            //hold one container
            //check for containers
            var containers = elements.filter(getContainers);
            var clawPosition = elements.filter(getClaw)[0].getAbsolutePosition();
            var size = containers[0].getBoundingInfo().boundingBox.extendSize;
            var closer_container = undefined;
            var currentDiff = -10000;
            for (var i = 0 ; i < containers.length; i++) {
                var c1 = containers[i];
                var posC1 = c1.getAbsolutePosition();
                if (Math.abs(posC1.y) - Math.abs(clawPosition.y) > currentDiff) {
                    currentDiff = Math.abs(posC1.y) - Math.abs(clawPosition.y);
                    closer_container = c1;
                }
                console.log('verify')
                console.log(posC1.y)
                console.log(clawPosition.y)
                console.log(posC1.y - clawPosition.y)
                console.log(c1.id);
            }
            console.log(closer_container.id);
            currentHoldingContainer = closer_container
            holding = !holding;
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

        //console.log(evt.keyCode);
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
    function getClaw(item) {
        return item.id === "Claw";
    }

    function getBoat(item) {
        return item.id === "Shiping_";
    }
    function getRope(item) {
        return item.id === "Rope";
    }

    function getContainers(item) {
        return item.id.includes("Container");
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