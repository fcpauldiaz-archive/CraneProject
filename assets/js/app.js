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
    var readyToDrop = false;
    var holding = false;
    var containersWithShip = [];
    var toggleCamera = 1;
    var camera, camera2, camera3;

    engine.enableOfflineSupport = false;

    var createScene = function() {
        var scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color3.White();
        scene.gravity = new BABYLON.Vector3(0, -9.81, 0);
        scene.collisionsEnabled = true;
       

        camera = new BABYLON.ArcRotateCamera(
            "arcCam",
            BABYLON.Tools.ToRadians(90),
            BABYLON.Tools.ToRadians(90),
            20.0,
            BABYLON.Vector3.Zero(),
            scene
        );
       /* camera2 = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(13.7, 6, -11), scene);
        //camera2.setTarget(new BABYLON.Vector3(200, 7, 0));
        camera2.rotation = new BABYLON.Vector3(0, 26.8,0);*/
        camera2 = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 0, 0), scene);
        camera2.heightOffset = 1;
        camera2.radius = 2;
        camera2.rotationOffset = -90;
        camera2.cameraAcceleration = 0.5;
        // camera2.rotation = new BABYLON.Vector3(0, BABYLON.Tools.ToRadians(180), 0);
       
        camera3 = new BABYLON.FreeCamera("FreeCamera", new BABYLON.Vector3(-1, 9, 3.5), scene);
        camera3.rotation = new BABYLON.Vector3(0, 9.5, 0);
      
        
        
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


        
         
       
        scene.registerBeforeRender(function() {
            // elements.forEach(function(element) {
            //     element.checkCollisions = true;              
            // });
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
                var claw = elements.filter(getClaw)[0];
                rotateElements(claw, BABYLON.Axis.Y, -Math.PI / 12);
                claw.rotationX === undefined? claw.rotationX = -Math.PI / 12:
                claw.rotationX -= Math.PI / 12;
                if (holding && currentHoldingContainer !== undefined) {
                    rotateElements(currentHoldingContainer, BABYLON.Axis.Y, -Math.PI / 12);
                    currentHoldingContainer.rotationX === undefined? currentHoldingContainer.rotationX = -Math.PI / 12:
                    currentHoldingContainer.rotationX -= Math.PI / 12;
                }
            }
            else {
                var boat = elements.filter(getBoat)[0];
                
                var isle = elements.filter(getIsle)[0];
                var transVector = new BABYLON.Vector3(0, 0, -1);
                var transVectorContainer = new BABYLON.Vector3(1, 0, 0);
                translateElements(elements.filter(getBoat)[0], transVector);
            
                for (var i = 0; i < containersWithShip.length; i++) {
                    var container = containersWithShip[i];
                    console.log(container.rotationX);
                    if (container.rotationX !== undefined) {
                        rotateElements(container, BABYLON.Axis.Y, -container.rotationX);    
                        translateElements(container, transVectorContainer);
                        rotateElements(container, BABYLON.Axis.Y, container.rotationX);    
                    } else {
                        translateElements(container, transVectorContainer);
                    }
                
                }
            }
        }

        //S
        if (evt.keyCode == 83) {
            if (actualElement === true) {
                var claw = elements.filter(getClaw)[0];
                rotateElements(claw, BABYLON.Axis.Y, Math.PI / 12);
                claw.rotationX === undefined? claw.rotationX = Math.PI / 12:
                claw.rotationX += Math.PI / 12;
                if (holding  && currentHoldingContainer !== undefined) {
                    rotateElements(currentHoldingContainer, BABYLON.Axis.Y, Math.PI / 12);
                    currentHoldingContainer.rotationX === undefined? currentHoldingContainer.rotationX = Math.PI / 12:
                    currentHoldingContainer.rotationX += Math.PI / 12;;
                }
                
            }
            else {
                var transVector = new BABYLON.Vector3(0, 0, 1);
                var boat = elements.filter(getBoat)[0];
                translateElements(boat, transVector);
                var isle = elements.filter(getIsle)[0];
                var transVectorContainer = new BABYLON.Vector3(-1, 0, 0);
                for (var i = 0; i < containersWithShip.length; i++) {
                    var container = containersWithShip[i];
                    console.log(container.rotationX);
                    if (container.rotationX !== undefined) {
                        rotateElements(container, BABYLON.Axis.Y, -container.rotationX);    
                        translateElements(container, transVectorContainer);
                        rotateElements(container, BABYLON.Axis.Y, container.rotationX);    
                    } else {
                        translateElements(container, transVectorContainer);
                    }
                
                }

            }
        }

        //A
        if (evt.keyCode == 65) {
            if (actualElement === true) {
                var crane = elements.filter(getCrane)[0];
                rotateElements(crane, BABYLON.Axis.Y, Math.PI / 12);
                var claw = elements.filter(getClaw)[0];
                console.log(claw.getAbsolutePosition());
                if (holding  && currentHoldingContainer !== undefined) {
                    
                    currentHoldingContainer.position.x = claw.getAbsolutePosition().x;
                    currentHoldingContainer.position.y = claw.getAbsolutePosition().y - 1.8;
                    currentHoldingContainer.position.z = claw.getAbsolutePosition().z;
                    currentHoldingContainer.rotationX = 0;
                }
            } else {
                var isle = elements.filter(getIsle)[0];
                var boat = elements.filter(getBoat)[0];
                
                rotateElements(boat, BABYLON.Axis.Y, -Math.PI / 16);
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
                
                if (holding  && currentHoldingContainer !== undefined) {
                    var claw = elements.filter(getClaw)[0];
                    currentHoldingContainer.position.x = claw.getAbsolutePosition().x;
                    currentHoldingContainer.position.y = claw.getAbsolutePosition().y - 1.8;
                    currentHoldingContainer.position.z = claw.getAbsolutePosition().z;
                    currentHoldingContainer.rotationX = 0;
                }
            }
            else {
                var isle = elements.filter(getIsle)[0];
                var boat = elements.filter(getBoat)[0];
                console.log(isle.intersectsMesh(boat, true));
                rotateElements(boat, BABYLON.Axis.Y, Math.PI / 16);
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
            readyToDrop = false;
            var center = clawPosition.x
            if ((Math.abs(clawPosition.y) -3) < Math.abs(boatPosition.y)
                && center > (boatPosition.x - 21.0) && center < (boatPosition.x + 20.77)
                && clawPosition.z > (boatPosition.z - 5.0) && clawPosition.z < (boatPosition.z + 5.0)) {
                    console.log(boatPosition);
                    console.log(clawPosition);
                readyToDrop = true;
                //drop on choque
                console.log('choca');
            } 
            else if (clawPosition.z > -3 && clawPosition.y <= 3.72) {
                console.log('choca isla');
            }
            else {
                

                var transVector = new BABYLON.Vector3(0, -0.5, 0);
                var transVector2 = new BABYLON.Vector3(0, -1, 0);
                translateElements(claw,transVector2);
                scaleElements(rope, dimensions[1], 1.1);
                translateElements(rope, transVector);
            }
            if (holding && currentHoldingContainer !== undefined) {
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
            if (holding  && currentHoldingContainer !== undefined) {
                var claw = elements.filter(getClaw)[0];
                currentHoldingContainer.position.x = claw.getAbsolutePosition().x;
                currentHoldingContainer.position.y = claw.getAbsolutePosition().y - 1.8;;
                currentHoldingContainer.position.z = claw.getAbsolutePosition().z;
            }
        }
        // spacebar
        if (evt.keyCode === 32) {
            //dropoff command
            console.log('drop')
            console.log(holding)
            console.log(readyToDrop)
            if (holding && readyToDrop && currentHoldingContainer !== undefined) {
                if (!containersWithShip.includes(currentHoldingContainer)) {
                    containersWithShip.push(currentHoldingContainer);
                    currentHoldingContainer = undefined;
                    console.log(containersWithShip);
                }
            }
            else {

                //hold one container
                //check for containers
                var containers = elements.filter(getContainers);
                var clawPosition = elements.filter(getClaw)[0].getAbsolutePosition();
                var size = containers[0].getBoundingInfo().boundingBox.extendSize;
                var closer_container = undefined;
                var currentDiff = 10000;
                var currentDiffZ = 10000;
                if (clawPosition.z > 1 && clawPosition.z <= 15 && 
                    clawPosition.x < -11 && clawPosition.x > -21
                    && clawPosition.y <= 12) {
                    for (var i = 0 ; i < containers.length; i++) {
                        var c1 = containers[i];
                        var posC1 = c1.getAbsolutePosition();
                        if (!containersWithShip.includes(c1)) {
                            console.log(Math.abs(Math.abs(posC1.y) - Math.abs(clawPosition.y)) < currentDiff);
                            console.log(Math.abs(Math.abs(posC1.z) - Math.abs(clawPosition.z)),  '<',  currentDiffZ, Math.abs(Math.abs(posC1.z) - Math.abs(clawPosition.z)) < currentDiffZ);
                            if (Math.abs(Math.abs(posC1.y) - Math.abs(clawPosition.y)) < currentDiff &&
                                Math.abs(Math.abs(posC1.z) - Math.abs(clawPosition.z)) < currentDiffZ) {
                                //console.log( Math.abs(posC1.z) - Math.abs(clawPosition.z) > currentDiffZ);
                                console.log('compare');
                                console.log(Math.abs(Math.abs(posC1.y) - Math.abs(clawPosition.y)));
                                console.log(currentDiff);
                                currentDiff = Math.abs(Math.abs(posC1.y) - Math.abs(clawPosition.y));
                                currentDiffZ = Math.abs(Math.abs(posC1.z) - Math.abs(clawPosition.z));
                                closer_container = c1;
                            }
                            console.log('verfiy')
                            console.log(posC1.z);
                            console.log(clawPosition.z);
                            console.log(Math.abs(Math.abs(posC1.z) - Math.abs(clawPosition.z)));
                            
                            console.log(c1.id);
                            closer_container === undefined ? '': console.log(closer_container.id);
                        }

                    }

                }
                console.log(clawPosition.z);
                console.log(clawPosition.z > 1 && clawPosition.z <= 15);
                currentHoldingContainer = closer_container
               
            }
            
            if (holding === true && readyToDrop === true) {
                holding = false;
            } else {
                holding = true;
            }
             
        }

        // Q
        if (evt.keyCode === 81) {
            var claw = elements.filter(getClaw)[0];
            var rope = elements.filter(getRope)[0];
            if (rope.position.z <= -5) {
                var cylinder = elements.filter(getCylinder)[0];
                var transVector = new BABYLON.Vector3(0, 0, 1);
                var transVector2 = new BABYLON.Vector3(0, 0, -1);
                if (claw.rotationX !== undefined) {
                
                    rotateElements(claw, BABYLON.Axis.Y, -claw.rotationX);
                    translateElements(claw,  transVector2);
                    rotateElements(claw, BABYLON.Axis.Y, claw.rotationX);
                }  else {
                    translateElements(claw,  transVector2);
                }
                
                translateElements(rope,  transVector);
                translateElements(cylinder, transVector);
                if (holding && currentHoldingContainer !== undefined) {
                    var claw = elements.filter(getClaw)[0];
                    currentHoldingContainer.position.x = claw.getAbsolutePosition().x;
                    currentHoldingContainer.position.y = claw.getAbsolutePosition().y - 1.8;;
                    currentHoldingContainer.position.z = claw.getAbsolutePosition().z;
                }
            }
        }

        // E
        if (evt.keyCode === 69) {
            var claw = elements.filter(getClaw)[0];
            var rope = elements.filter(getRope)[0];
            var cylinder = elements.filter(getCylinder)[0];
            var transVector = new BABYLON.Vector3(0, 0, -1);
            var transVector2 = new BABYLON.Vector3(0, 0, 1);
            
            if  (rope.position.z >= -31) {
                if (claw.rotationX !== undefined) {
                
                    rotateElements(claw, BABYLON.Axis.Y, -claw.rotationX);
                    translateElements(claw,  transVector2);
                    rotateElements(claw, BABYLON.Axis.Y, claw.rotationX);
                }  else {
                    translateElements(claw,  transVector2);
                }
                translateElements(rope,  transVector);
                translateElements(cylinder, transVector);
                if (holding && currentHoldingContainer !== undefined) {
                    var claw = elements.filter(getClaw)[0];
                    currentHoldingContainer.position.x = claw.getAbsolutePosition().x;
                    currentHoldingContainer.position.y = claw.getAbsolutePosition().y - 1.8;;
                    currentHoldingContainer.position.z = claw.getAbsolutePosition().z;
                }
            }
        }
    
        if (evt.keyCode === 84) {
            //1 normal camera, 2 crane , 3 boat
            var canvas = document.getElementById('canvas');
            
            toggleCamera++;
            if (toggleCamera === 4) toggleCamera = 1;
            switch(toggleCamera) {
                case 1: scene.activeCamera = camera; camera.attachControl(canvas); break;
                case 2: camera2.lockedTarget = elements.filter(getBoatCamera)[0]; scene.activeCamera = camera2;   break;
                case 3: scene.activeCamera = camera3;  camera3.attachControl(canvas); break;
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

    function getCylinder(item) {
        return item.id === "Cylinder3";
    }

    function getCraneCamera(item) {
        return item.id === "Box18";
    }
    
    function getBoatCamera(item) {
        return item.id === "Wheel1";
    }

    function getIsle(item) {
        return item.id === "Isle";
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