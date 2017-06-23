$(document).ready(function() {
  //fire base stuff--
  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyD0OYNbm34rfCoN1UnggDuQfNnr8ahcVs0",
    authDomain: "budgetapp-857ba.firebaseapp.com",
    databaseURL: "https://budgetapp-857ba.firebaseio.com",
    projectId: "budgetapp-857ba",
    storageBucket: "budgetapp-857ba.appspot.com",
    messagingSenderId: "93264138315"
  };

  firebase.initializeApp(config);

  var provider = new firebase.auth.GoogleAuthProvider();

  var database = firebase.database();

  var stockBought, budget;

  firebase.auth().onAuthStateChanged(function(user) {
    $("#enterBudget, #budgetPriceDisplay, #stockOptions, #displayText, #checkoutFooter, #navigation, #investmentSection").hide();
    if (user) {
      $("#navigation").show();
      $("#login").hide();
      checkState();
      loggedIn();
      maintainUserDetails();
      console.log("logged in");
    } else {
      notLoggedIn();
    }
  });

  function notLoggedIn() {
    $("#loginButton").on('click', function() {
      firebase.auth().signInWithPopup(provider).then(function(result) {
        // This gives you a Google Access Token. You can use it to access the Google API.
        var token = result.credential.accessToken;
        // The signed-in user info.
        user = result.user;
        name = user.displayName;
        email = user.email;
        photo = user.photoURL;
        uid = user.uid;
        console.log(photo);
        $('#pic').attr("src", user.photoURL);
        $('#userName').text(user.displayName);
        localStorage.setItem("name", user.displayName);
        localStorage.setItem("picture", user.photoURL);
        localStorage.setItem("guid", user.uid);
        //Checks for user in database
        database.ref("user/" + localStorage.guid).child("transactions").on("value", getData, error);

        function getData(snapshot) {
          if (snapshot.val() === null) {
            console.log("user doesn't exist in the database");
            localStorage.setItem("state", "budget-screen");
            checkState();
          } else {
            localStorage.setItem("state", "holdings-screen");
            checkState();
            console.log("user exists");
          }
        }

        function error(error) {
          console.log('error');
        }

        console.log("logged in");
        // ...
      }).catch(function(error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        // ...
      });
    });
  }

  function checkState() {
    if (localStorage.state === "budget-screen") {
      $("#enterBudget, #navigation").show();
      $("#login").hide();
    } else if (localStorage.state === "buy-stock-screen") {
      $("#enterBudget, #checkoutFooter").hide();
      $("#budgetPriceDisplay, #stockOptions, #displayText").show();
      budgetFilter();
      loadUserBudget();
    } else if (localStorage.state === "confirm-stock-screen") {
      loadUserTransactions();
      $("#checkoutFooter").show();
      $("#budgetPriceDisplay, #stockOptions, #displayText").hide();
      $("#investmentSection").hide();
    } else if (localStorage.state === "holdings-screen") {
      drawChart();
      loadUserTransactions();
      getNews();
      $("#investmentSection").show();
      $("#checkoutFooter").hide();

    }
  }

  function maintainUserDetails() {
    $('#pic').attr("src", localStorage.picture);
    $('#userName').text(localStorage.name);
    $("#holdings-user-image").attr("src", localStorage.picture);
    $("#holdings-user-name").text(localStorage.name.split(" ")[0]);
  }

  function loadUserTransactions() {
    var data = database.ref('user/' + localStorage.guid);

    data.child('transactions').on("value", getData, error);

    function getData(snapshot) {
      var quantity = parseInt(snapshot.val().purchaseQuantity);
      var stockName = snapshot.val().stockName;
      var balance = snapshot.val().balance;
      var price = snapshot.val().purchasePrice;
      console.log(quantity);
      $("#stockName").text(stockName);
      $("#stockQuantity").text(quantity);
      $("#holdings-user-balance, #remainingChange").text(balance);

      $("#holdings-stock-quantity").text(quantity);
      $("#holdings-stock-name").text(stockName);

      console.log(quantity);
      console.log('entered the load transactions scope');
    }

    function error(error) {
      console.log('error');
    }

    data.child('account').on("value", retrieveData, error);

    function retrieveData(snapshot) {
      var initBudget = snapshot.val().budget;
      $("#holdings-user-budget").text(initBudget);
    }

    function error(error) {
      console.log('error');
    }
  }

  function loadUserBudget() {

    database.ref('user/' + localStorage.guid).on("value", getData, error);

    function getData(snapshot) {
      var balance = parseInt(snapshot.val().account.balance);
      $("#chosenBudget").text(balance);
      console.log(balance);
    }

    function error(error) {
      console.log(error);
    }
  }

  function loggedIn() {
    //first entering budget button
    $("#budgetButton").on('click', function() {
      var input = $("#userBudget").val();
      // NOTE: input validation
      if ($.isNumeric(input)) {
        localStorage.setItem("budget", $("#userBudget").val());

        database.ref('user/' + localStorage.guid).child('account').update({
          'budget': $("#userBudget").val(),
          'balance': $("#userBudget").val()
        });
        loadUserBudget();
        localStorage.setItem("state", "buy-stock-screen");
        checkState();
      } else {
        $("#userBudget").val('');
        $("#userBudget").attr("placeholder", "enter number");
      }
    });

    //sets the name and the photo
    database.ref('user/' + localStorage.guid).child('profile').set({
      'name': localStorage.name,
      'photoURL': localStorage.picture
    });


    //function that runs once the buy button is clicked
    $(document).on('click', ".buy", function() {
      console.log('clicked buy');
      stockBought = $(this).closest(".stock").data("symbol");
      var stockName = $(this).closest(".stock").find(".stockName").text();

      var stockPrice = $(this).closest(".stock").find(".stockPrice").text();
      console.log(stockPrice);

      database.ref('user/' + localStorage.guid).child('transactions').update({
        'balance': (budget % stockPrice).toFixed(2),
        'purchaseDate': moment().format("YYYY-MM-DD"), //today's date
        'purchasePrice': stockPrice, // price of stock needs to be here
        'purchaseQuantity': budget / stockPrice, //budget divided by stock price
        'ticker': stockBought,
        'stockName': stockName
      });
      database.ref('user/' + localStorage.guid).child('account').update({
        'balance': (budget % stockPrice).toFixed(2)
      });

      localStorage.setItem("state", "confirm-stock-screen");
      checkState();
    });

    $(document).on("click", "#confirm, #cancel", function() {
      if ($(this).attr("id") === "confirm") {
        localStorage.setItem("state", "holdings-screen");
      } else if ($(this).attr("id") === "cancel") {
        database.ref('user/' + localStorage.guid).child('transactions').remove();
        var resetBudget;
        database.ref('user/' + localStorage.guid).child('account').once('value', getData, error);

        function getData(snapshot) {
          resetBudget = snapshot.val().budget;
        }
        function error(error) {
          console.log('error');
        }

        database.ref('user/' + localStorage.guid).child('account').update({
          balance: resetBudget
        })
        localStorage.setItem("state", "buy-stock-screen");
      }
      checkState();
    });

    $("#sell").on("click", function() {
      var sellQuantity, sellPrice, ticker, purchasePrice, gain;

      database.ref('user/' + localStorage.guid).child('transactions').on("value", getData, error);

      function getData(snapshot) {
        sellQuantity = parseInt(snapshot.val().purchaseQuantity);
        purchasePrice = parseFloat(snapshot.val().purchasePrice);
        ticker = snapshot.val().ticker;
        budget = parseInt(snapshot.val().balance);
        database.ref('user/' + localStorage.guid).child('transactions').update({
          'sellQuantity': sellQuantity, // quantity of stock sold
          'sellDate': moment().format("YYYY-MM-DD") //today's date
        });
      }

      function error(error) {
        console.log('error');
      }

      database.ref('stockPrices/' + ticker).child("buyStockScreen").on("value", retrieveData, malfunction);

      function retrieveData(snapshot) {
        sellPrice = parseFloat(snapshot.val().currentPrice);

        database.ref('user/' + localStorage.guid).child('transactions').update({
          'sellPrice': sellPrice // price sold for --- aka current price of the stock
        });

        gain = (sellPrice - purchasePrice) * sellQuantity;

        console.log('sellQuantity: ' + sellQuantity);
        console.log('purchasePrice: ' + purchasePrice);
        console.log('sellPrice: ' + sellPrice);
        console.log('new budget is: ' + budget);
        console.log("you gained: " + gain);

        budget = (sellQuantity * sellPrice) + budget;

        database.ref('user/' + localStorage.guid).child('account').update({
          'balance': budget
        });
      }
      function malfunction(error) {
        console.log(error);
      }
      $("#investmentSection").hide();
      $("#budgetPriceDisplay, #stockOptions, #displayText").show();
      localStorage.setItem("state", "buy-stock-screen");
      checkState();
    });
    //button effects
    $(document).on("mousedown", "button, .buy", function() {
      $(this).css({
        'top': '5px',
        'left': '5px',
        'box-shadow': 'none'
      });
    });
    $(document).on("mouseup", "button, .buy", function() {
      $(this).css({
        'top': '0px',
        'left': '0px',
        'box-shadow': ' 5px 5px 0px #189699'
      });
    });
  }

  function budgetFilter() {
    //array of all the dow 30 stocks
    var blueChip = ["AAPL", "AXP", "BA", "CAT", "CSCO", "CVX", "DD", "DIS",
      "GE", "GS", "HD", "IBM", "INTC", "JNJ", "JPM", "KO", "MCD", "MMM", "MRK",
      "MSFT", "NKE", "PFE", "PG", "UNH", "UTX", "V", "VZ", "WMT", "XOM"
    ];

    database.ref('user/' + localStorage.guid).on('value', getData, error);

    function getData(snapshot) {
      budget = parseFloat(snapshot.val().account.balance);
    }

    function error(error) {
      console.log('error');
    }

    //for lop to iterate through all the stocks
    var canBuy = 0;
    for (var i = 0; i < blueChip.length; i++) {

      database.ref("stockPrices/" + blueChip[i]).child("buyStockScreen").on("value", getData, error);

      function getData(snapshot) {
        var stockLogo = snapshot.val().imageURL;
        var stockTitle = snapshot.val().name;
        var twoWeeks = snapshot.val().twoWeeks;
        var twoMonths = snapshot.val().twoMonths;
        var twoYears = snapshot.val().twoYears;
        var stockPrice = snapshot.val().currentPrice;
        var symbol = snapshot.val().symbol;
        if (budget > stockPrice) {
          canBuy++;
          $("#stockNumber").text(canBuy);
          var otherHtmlStuff = "<div class='row stock' data-symbol=" + symbol + ">" +
            "<div class='col-md-2'>" +
            "<img src=" + stockLogo + " class='logos' alt='stock-image'>" +
            "</div>" +
            "<div class='col-md-8'>" +
            "<h4 class='stockName'>" + stockTitle + " (" + symbol + ")</h4>" +
            "<p>Price of stock 2 weeks ago: <span id=" + symbol + "-week  class='twoWeeks'>" + twoWeeks + "</span></p>" +
            "<p>Price of stock 2 months ago: <span id=" + symbol + "-month class='twoMonths'>" + twoMonths + "</span></p>" +
            "<p>Price of stock 2 years ago: <span id=" + symbol + "-year class='twoYears'>" + twoYears + "</span></p>" +
            "</div>" +
            "<div class='col-md-2'>" +
            //we'd enter the stock price here below
            "<h2>" + "$ <span class='stockPrice'>" + stockPrice + "</span></h2>" +
            "<button class='buy' type='button' name='button'><h3>Buy</h3></button>" +
            "</div>" +
            "</div>";

          $("#stockOptions").prepend(otherHtmlStuff);
        } else {
          console.log(stockTitle + " was not in your budget because it costs " + stockPrice);
        }
      }

      function error(error) {
        console.log('error');
      }
    }
  }

  $("#logOut").on('click', function() {
    localStorage.removeItem("state");
    localStorage.removeItem("name");
    localStorage.removeItem("picture");
    localStorage.removeItem("budget");
    firebase.auth().signOut().then(function() {
      // Sign-out successful.
      console.log("You've signed out");
      $("#budget, #budgetPriceDisplay, #stockOptions, #displayText, #checkOut, #navigation, #investmentSection").hide();
      $("#login").show();
      location.reload();
    }).catch(function(error) {
      // An error happened.
    });
  });

//chart function (data viz)
  function drawChart() {
           var myStockRefA = database.ref('/');
            myStockRefA.once("value", parseStock);
            function parseStock(snapshot) {
              var compareToStocks =  ["PG", "AXP", "BA", "IBM"];
              //trying to push user info inside of array
              var userGoogleId = localStorage.guid;
              var userStock = snapshot.val().user[userGoogleId].transactions.ticker;
              compareToStocks.unshift(userStock);
              //-- ends here
              // NOTE: compareToStocks was here before
              var pricesAtPurchaseDate = [];
              var pricesToday = [];
              if (snapshot.val()) {
                var stocks = snapshot.val();
                for (var i = 0; i < compareToStocks.length; i++)  {
                  var userGuid = localStorage.guid;
                  var stock = compareToStocks[i];
                  var stockPricePurchase = stocks.stockPrices[stock].daily['2015-06-24'].closePrice;
                  var stockPriceToday = stocks.stockPrices[stock].daily['2017-06-20'].closePrice;
                  var myStock = stocks.user[userGuid].transactions.ticker;
                  var quantity = stocks.user[userGuid].transactions.purchaseQuantity;
                  var purchasePrice = stocks.user[userGuid].transactions.purchasePrice;
                  var purchaseDate = stocks.user[userGuid].transactionspurchaseDate;
                  pricesAtPurchaseDate.push(stockPricePurchase);
                  pricesToday.push(stockPriceToday);
                }
                graphBars(pricesAtPurchaseDate, pricesToday, compareToStocks);
              }
            }

       function graphBars(pricesAtPurchaseDate, pricesToday, compareToStocks) {
          console.log(pricesAtPurchaseDate, pricesToday, compareToStocks);
          var ctx = document.getElementById("myChart").getContext('2d');
          var myChart = new Chart(ctx, {
            type: 'bar',
              data: {
              labels: compareToStocks,
                datasets: [{
                    label: 'Price 2 years ago',
                    data: pricesAtPurchaseDate,
                    backgroundColor: [
                      'rgba(100, 255, 132, 0.2)',
                      'rgba(255, 99, 132, 0.2)',
                      'rgba(255, 99, 132, 0.2)',
                      'rgba(255, 99, 132, 0.2)',
                      'rgba(255, 99, 132, 0.2)',
                    ],
                    borderColor: [
                      'rgba(100,255,132,1)',
                      'rgba(255,99,132,1)',
                      'rgba(255,99,132,1)',
                      'rgba(255,99,132,1)',
                      'rgba(255,99,132,1)',
                    ],
                    borderWidth: 1
                  },
                  {
                    label: 'Price Today',
                    data: pricesToday,
                    backgroundColor: [
                      'rgba(5, 159, 64, 1)',
                      'rgba(255, 159, 64, 0.2)',
                      'rgba(255, 159, 64, 0.2)',
                      'rgba(255, 159, 64, 0.2)',
                      'rgba(255, 159, 64, 0.2)'],
                    borderColor: [
                      'rgba(0, 0, 0, 5)',
                      'rgba(255, 159, 64, 1)',
                      'rgba(255, 159, 64, 1)',
                      'rgba(255, 159, 64, 1)',
                      'rgba(255, 159, 64, 1)'],
                    borderWidth: 1
                  }
                ]
              },
              options: {
                scales: {
                  yAxes: [{
                    stacked: false,
                    ticks: {
                      beginAtZero: true
                    }
                  }],
                  xAxes: [{
                    stacked: false,
                    ticks: {
                      beginAtZero: true
                    }
                  }]

               }
              }
            });}
        }

// news function
  function getNews() {
    // Randomizing the sources
    var providers = ["business-insider", "bloomberg", "financial-times", "reuters", "fortune"];

    var storyToday = providers[Math.floor(Math.random() * providers.length)];

    var queryURL = "https://newsapi.org/v1/articles";

    $.ajax({
      data: {
        source: storyToday,
        apiKey: 'fd833a2990514dcd98f2eb1ef0a4cbfd'
      },
      url: queryURL,
      crossDomain: true,
      dataType: "JSON",
      jsonpCallback: "callback",
      method: "GET"
    }).done(function(response) {
      var i = [Math.floor(Math.random() * 5)];
      var headline = (response.articles[i].title);
      var url = (response.articles[i].url);
      var source = (response.source);
      var image = (response.articles[i].urlToImage);

      console.log(response);

      $("#provider-view").html('<h5> -' + source.toUpperCase() + '</h5>');
      $("#headline-view").html('<h4><strong>' + headline + '</strong></h4>');
      $("#image-view").html('<img id="articlePic" src="' + image + '"><h3></h3></a>');
      $("#url-view").html('<a target="_blank" href=' + url + '><h3>' + "Link to article" + '</h3></a>');
    });
  }


});
