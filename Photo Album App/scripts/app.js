(function() {
    document.addEventListener("deviceready", function() {
        var platformIp = localStorage.getItem('platform-ip') || "";

        window.configViewModel = kendo.observable({
            platformIp: platformIp,
            close: function() {
                if (this.platformIp.trim() === "") {
                    navigator.notification.alert("Please provide an IP address.");
                    return;
                }

                platformIp = this.platformIp;
                localStorage.setItem('platform-ip', platformIp)
                $("#config").data("kendoMobileModalView").close();
                runServices();
            }
        });

        window.listview = kendo.observable({
            addImage: function() {
                var mon = window.plugins.EqatecAnalytics.Monitor;
                mon.TrackFeature("Images.Add");
                var success = function(data) {
                    window.everlive.Files.create({
                        Filename: Math.random().toString(36).substring(2, 15) + ".jpg",
                        ContentType: "image/jpeg",
                        base64: data
                    }).then(window.loadPhotos);
                };
                var error = function() {
                    navigator.notification.alert("Unfortunately we could not add the image");
                };
                var config = {
                    destinationType: Camera.DestinationType.DATA_URL,
                    targetHeight: 400,
                    targetWidth: 400
                };
                navigator.camera.getPicture(success, error, config);
            },
            showFeedback: function() {
                var mon = window.plugins.EqatecAnalytics.Monitor;
                mon.TrackFeature("Feedback.Show");
                feedback.showFeedback();
            }
        });

        var app = new kendo.mobile.Application(document.body, {
            skin: "flat"
        });

        function runServices() {
            var feedbackUrl = "http://" + platformIp + "/feedback/api/v1";
            feedback.initialize("164851c0-8aa6-11e4-bfd7-a7a4f5e3624e", {
                "apiUrl": feedbackUrl
            });

            var everliveApiKey = "M5UjpkU6RmlacU2r";
            var everliveUrl = "//" + platformIp + "/bs-api/v1/";
            var everliveScheme = "http";

            window.everlive = new Everlive({
                url: everliveUrl,
                apiKey: everliveApiKey,
                scheme: everliveScheme
            });

            var analyticsProductKey = "b7922705a458436f83f638dc168dccdd";


            // Handy shortcuts to the analytics api
            var factory = window.plugins.EqatecAnalytics.Factory;
            var monitor = window.plugins.EqatecAnalytics.Monitor;
            // Create the monitor instance using the unique product key for analytics
            var settings = factory.CreateSettings(analyticsProductKey);
            settings.LoggingInterface = factory.CreateTraceLogger();
            settings.ServerUri = "http://192.168.52.43:8080/";
            factory.CreateMonitorWithSettings(settings,
                function() {
                    console.log("Monitor created");
                    // Start the monitor inside the success-callback
                    monitor.Start(function() {
                        console.log("Monitor started");
                    });
                },
                function(msg) {
                    console.log("Error creating monitor: " + msg);
                });




            window.loadPhotos = function() {
                everlive.Files.get().then(function(data) {
                    var files = [];
                    data.result.forEach(function(image) {
                        files.push(image.Uri.replace("/telerik-platform/", "/" + platformIp + "/"));
                    });
                    $("#images").kendoMobileListView({
                        dataSource: files,
                        template: "<img src='#: data #'>"
                    });
                });
            };

            window.loadPhotos();
        }
    });
}());