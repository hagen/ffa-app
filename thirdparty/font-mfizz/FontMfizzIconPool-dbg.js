sap.ui.define(['jquery.sap.global', 'sap/ui/core/IconPool'],
  function(jQuery, IconPool) {
    "use strict";

    if (FontMfizzIconPool) {
      return;
    }

    // I require the font awesome stylesheet
    jQuery.sap.includeStyleSheet("thirdparty/font-mfizz/font-mfizz.css");

    var aIconNames = ["3dprint",
      "antenna",
      "apache",
      "aws",
      "blackberry",
      "bomb",
      "c",
      "cassandra",
      "centos",
      "clojure",
      "coffee-bean",
      "cplusplus",
      "csharp",
      "css",
      "database",
      "database-alt",
      "database-alt2",
      "debian",
      "dreamhost",
      "fedora",
      "fire-alt",
      "freebsd",
      "ghost",
      "gnome",
      "google",
      "google-alt",
      "google-code",
      "google-developers",
      "grails",
      "grails-alt",
      "hadoop",
      "haskell",
      "heroku",
      "html",
      "iphone",
      "java",
      "java-bold",
      "java-duke",
      "javascript",
      "jetty",
      "kde",
      "line-graph",
      "linux-mint",
      "looking",
      "mariadb",
      "mfizz",
      "microscope",
      "mobile-device",
      "mobile-phone-alt",
      "mobile-phone-broadcast",
      "mssql",
      "mysql",
      "mysql-alt",
      "netbsd",
      "nginx",
      "nginx-alt",
      "nginx-alt2",
      "nodejs",
      "objc",
      "oracle",
      "oracle-alt",
      "osx",
      "perl",
      "phone-alt",
      "phone-retro",
      "php",
      "php-alt",
      "platter",
      "playframework",
      "playframework-alt",
      "postgres",
      "postgres-alt",
      "python",
      "raspberrypi",
      "redhat",
      "redis",
      "ruby",
      "ruby-on-rails",
      "ruby-on-rails-alt",
      "satellite",
      "scala",
      "scala-alt",
      "script",
      "script-alt",
      "shell",
      "solaris",
      "splatter",
      "suse",
      "tomcat",
      "ubuntu",
      "wireless"
    ];

    var aIconCodes = ["f14e",
      "f128",
      "f139",
      "f11d",
      "f147",
      "f11e",
      "f10e",
      "f150",
      "f14b",
      "f13f",
      "f129",
      "f101",
      "f134",
      "f13d",
      "f124",
      "f125",
      "f110",
      "f10c",
      "f146",
      "f119",
      "f103",
      "f107",
      "f11a",
      "f116",
      "f11b",
      "f12f",
      "f158",
      "f157",
      "f10d",
      "f15a",
      "f13a",
      "f130",
      "f108",
      "f137",
      "f12d",
      "f10a",
      "f142",
      "f12c",
      "f148",
      "f152",
      "f159",
      "f14f",
      "f145",
      "f11f",
      "f131",
      "f138",
      "f100",
      "f104",
      "f140",
      "f13c",
      "f156",
      "f118",
      "f121",
      "f11c",
      "f112",
      "f143",
      "f144",
      "f14c",
      "f105",
      "f154",
      "f155",
      "f123",
      "f117",
      "f133",
      "f132",
      "f135",
      "f14a",
      "f12b",
      "f13e",
      "f122",
      "f10f",
      "f136",
      "f109",
      "f111",
      "f106",
      "f114",
      "f120",
      "f113",
      "f13b",
      "f10b",
      "f115",
      "f12a",
      "f127",
      "f12e",
      "f126",
      "f151",
      "f14d",
      "f141",
      "f153",
      "f149",
      "f102"
    ];
    var fontMfizzIconFamily = "FontMfizz";

    var FontMfizzIconPool = function() {
      // Do not use the constructor
      throw new Error();
    };

    //register the built in icons
    jQuery.each(aIconNames, function(index, name) {
      IconPool.addIcon(name, fontMfizzIconFamily, {
        fontFamily: fontMfizzIconFamily,
        content: aIconCodes[index]
      });
    });

    return FontMfizzIconPool;
  }, /* bExport */ true);
