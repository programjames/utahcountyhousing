google.charts.load('current', {
  'packages': ['corechart']
});

async function getData(serial = 360910003, year = 2020) {

  // Chrome blocks no-cors requests, so for now use https://cors-anywhere.herokuapp.com/ to bypass it.
  const url = "https://cors-anywhere.herokuapp.com/http://www.utahcounty.gov/LandRecords/PropertyValues.asp?av_serial=" + serial + "&av_year=" + year;
  const response = await fetch(url);
  const data = await response.text();

  let re = /(?<=Owner:)(.*)(?=<br>)/;
  let matches = data.match(re);
  const return0 = matches[0].toLowerCase();
  re = /(?<=Property Type:)(.*)(?=<br>)/;
  matches = data.match(re);
  const return1 = matches[0].split(" - ")[1].toLowerCase()
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, "text/html");
  let all = doc.getElementsByTagName("td");
  for (var i = 0, max = all.length; i < max; i++) {
    if (all[i].innerText == "Total Real Property") {
      break;
    }
  }
  let tr = all[i].parentNode;
  let td = tr.children[5];
  const return2 = td.children[0].innerText;
  return [return0, return1, return2];
}

async function setData(serial = 360910003, year = 2020) {
  let data = await getData(serial, year);
  document.getElementById("owner").innerHTML = "<span class='bold'>Owner:</span> " + data[0];
  document.getElementById("property-type").innerHTML = "<span class='bold'>Property Type:</span> " + data[1];
  document.getElementById("value").innerHTML = "<span class='bold'>Current Value:</span> " + data[2];
}

setData("22:015:0002");

async function EventListener(event = null) {
  var data;
  var serial;
  try {
    if (event != null) {
      event.preventDefault();
    }
    let houseNum = document.getElementById("house-num").value;
    let dir = document.getElementById("dir").value;
    let streetName = document.getElementById("street-name").value;
    let streetType = document.getElementById("street-type").value;
    let loc = document.getElementById("loc").value;
    if (houseNum === "" || streetName === "" || streetType === "" || loc === "") {
      return;
    }
    const url = "https://cors-anywhere.herokuapp.com/http://www.utahcounty.gov/LandRecords/AddressSearch.asp?av_house=" + houseNum + "&av_dir=" + dir + "&av_street=" + streetName + "&street_type=" + streetType + "&av_location=" + loc + "&av_valid=...&Submit=++++Search++++"
    const response = await fetch(url);
    data = await response.text();

    let re = /(?<=av_serial=)(.*)(?=">)/;
    let matches = data.match(re);
    serial = matches[0];
    await setData(serial, 2020);

    document.getElementById("results").style.display = "block";
    document.getElementById("loading").style.display = "block";
    document.getElementById("valueChart").style.display = "none";
    document.getElementById("error").style.display = "none";
  } catch (err) {
    document.getElementById("error").style.display = "block";
    console.log(err.message);
  }
  try {
    dataTable = new google.visualization.DataTable();
    dataTable.addColumn('string', 'Year');
    dataTable.addColumn('number', 'Value');
    dataTable.addColumn({
      'type': 'string',
      'role': 'tooltip',
      'p': {
        'html': true
      }
    });
    var tabledata = [];

    re = /(?<=\<td nowrap\>\<span class="style1" \>)(.*)(?=\.\.\.\<\/span\>\<\/td\>)/;
    matches = data.match(re);
    for (let year = Math.max(2000, parseInt(matches[0])); year <= 2020; year++) {
      let c1 = year.toString();
      let dat = await getData(serial, year);
      let c2 = parseInt(dat[2].substring(1).replace(",", ""));
      let c3 = "<div class='tooltip'>";
      c3 += "<p class='info'><span class='bold'>Owner:</span> " + dat[0] + "</p>";
      c3 += "</div>";
      tabledata.push([c1, c2, c3]);
    }
    dataTable.addRows(tabledata);
    var options = {
      focusTarget: 'datum',
      tooltip: {
        isHtml: true
      },
      legend: 'none',
      backgroundColor: "none",
      title: 'House Value Over Time',
      curveType: 'none',
      legend: {
        position: 'bottom'
      },
      hAxis: {
        maxAlternation: 1,
      },
      vAxis: {
        gridlines: {
          count: -1
        }
      },
      chartArea: {
        top: 100,
        bottom: 100,
        height: '60%'
      }
    };
    document.getElementById("valueChart").style.display = "block";
    var chart = new google.visualization.LineChart(document.getElementById('valueChart'));
    chart.draw(dataTable, options);
    document.getElementById("loading").style.display = "none";
    document.getElementById("error2").style.display = "none";
  } catch (err) {
    document.getElementById("error2").style.display = "block";
    console.log(err);
  }
}

document.getElementById("submit-btn").addEventListener("click", EventListener);