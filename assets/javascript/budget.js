// <script src="https://www.gstatic.com/firebasejs/4.1.2/firebase.js"></script>
// <script>
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

  var database = firebase.database();


  // add button onclick event
  $("#some-button").on("click", function(event) {
    event.preventDefault();

    // prepare variables
    var email = $("#email-input").val().trim();
    var budget = $("#budget-input").val().trim();
    var stockSymbol = $("#stockSymbol-input").val().trim();
    var purchasePrice = // auto populate from barchart API previous day closing price
    var shares = // auto populate base on budge and price
    var purchaseDate = // auto populate with current date/time ---moment($("#purchaseDate-input").val().trim(), "DD/MM/YY").format("X");

    // Creates local "temporary" object for holding employee data
    var purchase = {
      email: email,
      budget: budget,
      stockSymbol: stockSymbol,
      purchasePrice: purchasePrice,
      shares: shares,
      purchaseDate: purchaseDate
    };

    // Uploads employee data to the database
    database.ref().push(purchase);

    // Logs everything to console
    console.log(email.email);
    console.log(budget.budget);
    console.log(stockSymbol.stockSymbol);
    console.log(purchasePrice.purchasePrice);
    console.log(shares.shares);
    console.log(purchaseDate.purchaseDate)

    // Alert TODO, convert to modal
    alert("Employee successfully added");

    // Clears all of the text-boxes
    $("#email-input").val("");
    $("#budget-input").val("");
    $("#stockSymbol-input").val("");
  });

  // 3. Create Firebase event for adding employee to the database and a row in the html when a user adds an entry
  database.ref().on("child_added", function(childSnapshot, prevChildKey) {

    console.log(childSnapshot.val());

    // Store everything into a variable.
    var email = childSnapshot.val().email;
    var budget = childSnapshot.val().budget;
    var stockSymbol = childSnapshot.val().stockSymbol;
    var purchasePrice = childSnapshot.val().purchasePrice;
    var shares = childSnapshot.val().shares;
    var purchaseDate = childSnapshot.val().purchaseDate;

    // Purchase Info
    console.log(email);
    console.log(budget);
    console.log(stockSymbol);
    console.log(purchasePrice);
    console.log(shares);
    console.log(purchaseDate);

    // Prettify the purchase date
    var purchaseDatePretty = moment.unix(purchaseDate).format("MM/DD/YY");

    // Calculate daily gains from purchase date to current date
    // store in array, loop through the API results
    var marketValueArr = [] //some calc here
    var marketValue; // market value now, should be the last item in the array
    console.log(marketValue);

    // Calculate theorical gains at time of purchase
    // gain if purchased (1) 2-days ago (2) 2-months ago (3) 2-years ago
    // must loop through two years of daily closing price
    var tMaketValueArr = [] // some loop here, store 2 day, 2 month, 2 years in an array
    var tMarketValue2Days = tMaketValueArr[0];
    var tMarketValue2Months = tMaketValueArr[1];;
    var tMarketValue2Years = tMaketValueArr[2];;
    console.log(tMaketValue);

    // add to DOM
    $("#some-table > tbody").append("<tr><td>" + email + "</td><td>" + budget + "</td><td>" +
    stockSymbol + "</td><td>" + purchasePrice + "</td><td>" + shares + "</td><td>" + purchaseDate + "</td></tr>") +
    tMarketValue2Days + "</td><td>" + tMarketValue2Months + "</td><td>" + tMarketValue2Years + "</td><td>" + marketValue + "</td></tr>");
  });
// </script>
