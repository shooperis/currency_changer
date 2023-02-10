const formElement = document.querySelector('#form');
const currencySelectionFromElement = formElement.querySelector('select[name="currency-from"]');
const currencySelectionToElement = formElement.querySelector('select[name="currency-to"]');
const changeSidesElement = formElement.querySelector('#sides-changer');
const buttonSubmit = formElement.querySelector('button[type="submit"]');
const outputElement = formElement.querySelector('#output');
const ratesHistoryListWrapperElement = document.querySelector('#list-wrapper');
const authOptions = {
	method: 'GET',
	headers: {
		'X-RapidAPI-Key': '129939537amsha2d6a3c6f84b746p172e29jsneff21af372cb',
		'X-RapidAPI-Host': 'currency-converter5.p.rapidapi.com'
	}
};
let ratesHistoryData;

fetch('https://currency-converter5.p.rapidapi.com/currency/list', authOptions)
	.then(res => res.json())
	.then(data => {
    init(data);
  });

function init(currenciesArray) {
  renderSelectOptions(currenciesArray.currencies, 'EUR', currencySelectionFromElement);
  renderSelectOptions(currenciesArray.currencies, 'USD', currencySelectionToElement);
  renderRatesHistoryList();
      
  formElement.querySelectorAll('select').forEach(element => {
    element.addEventListener('change', event => {
      iconsSign(event.target.value, event.target);
    });
  });

  formElement.querySelector('input[name="valet"]').addEventListener('input', function(e) {
    if (!this.oldValue) {
      this.oldValue = 1;
    }

    if (/^\d*\.?\d*$/.test(this.value)) {
      this.oldValue = this.value;
    } else {
      this.classList.add('input-error');
      setTimeout(() => {
        this.classList.remove('input-error');
      }, '300')
      
      this.value = this.oldValue;
    }
  });

  formElement.addEventListener('submit', event => {
    event.preventDefault();
    buttonSubmit.setAttribute('disabled', true);
    let thisForm = event.target;
    let valetValue = thisForm.valet.value;
    let currencyFrom = thisForm['currency-from'].value;
    let currencyTo = thisForm['currency-to'].value;
  
    fetch(`https://currency-converter5.p.rapidapi.com/currency/convert?format=json&from=${currencyFrom}&to=${currencyTo}&amount=${valetValue}`, authOptions)
      .then(res => res.json())
	    .then(data => {
        let changedRates = data.rates;
        outputElement.textContent = '';

        Object.keys(changedRates).forEach(currency => {
          let outputStr = `${data.amount} ${data.base_currency_code} = ${changedRates[currency].rate_for_amount} ${currency}`;
          outputElement.textContent += outputStr;
          ratesHistoryData.push(outputStr);
        });

        buttonSubmit.removeAttribute('disabled');
        dbLocalStorage('set', ratesHistoryData);
        renderRatesHistoryList();
      })
      .catch(err => {
        outputElement.textContent = 'Įvyko klaida.';
      });
  });

  document.querySelector('#show-rates-history-button').addEventListener('click', function (event) {
    toggleRatesHistory(event.target);
  });

  changeSidesElement.addEventListener('click', function (event) {
    oldValueFrom = currencySelectionFromElement.value;
    oldValueTo = currencySelectionToElement.value;
    currencySelectionFromElement.value = oldValueTo;
    currencySelectionToElement.value = oldValueFrom;
    changeSidesElement.querySelector('i').classList.toggle('rotate');
    iconsSign(oldValueTo, currencySelectionFromElement);
    iconsSign(oldValueFrom, currencySelectionToElement);
  });
}

function renderSelectOptions(currenciesArray, selectedCurrency, element) {
  Object.keys(currenciesArray).forEach(currency => {
    let optionElement = document.createElement('option');
    optionElement.textContent = currency;
    optionElement.value = currency;
    if (currency == selectedCurrency) {
      optionElement.setAttribute('selected', true);
    }
    element.append(optionElement);
  });

  iconsSign(selectedCurrency, element);
}

async function iconsSign(currency, element) {
  let countryImage = await fetch('./assets/json/country-list.json')
    .then(res => res.json())
    .then(countries => {
      if (countries[currency]) {
        return `https://flagcdn.com/48x36/${countries[currency].toLowerCase()}.png`;
      } else {
        return `./assets/images/unknown-currency.png`;
      }
    });
    
    element.closest('.select-box').querySelector('img').src = countryImage;
}

function toggleRatesHistory(button) {
  button.classList.toggle('active');
  ratesHistoryListWrapperElement.classList.toggle('hidden');
}

function renderRatesHistoryList() {
  if (!ratesHistoryData) {
    dbLocalStorage('get');
  }

  ratesHistoryListWrapperElement.innerHTML = '';

  if (ratesHistoryData.length) {
    let ratesListElement = document.createElement('ul');

    ratesHistoryData.forEach((item) => {
      let ratesListItemElement = document.createElement('li');
      ratesListItemElement.textContent = item;
      ratesListElement.prepend(ratesListItemElement);
    });

    ratesHistoryListWrapperElement.append(ratesListElement);
  } else {
    let ratesListNoItemsElement = document.createElement('span');
    ratesListNoItemsElement.textContent = 'Įrašų nėra.';
    ratesHistoryListWrapperElement.append(ratesListNoItemsElement);
  }
}

function dbLocalStorage(action) {
  if (action == 'get') {
    ratesHistoryData = JSON.parse(localStorage.getItem('ratesHistoryData'));
    if (!ratesHistoryData) {
      ratesHistoryData = [];
      dbLocalStorage('set');
    }
  } else if (action == 'set') {
    localStorage.setItem('ratesHistoryData', JSON.stringify(ratesHistoryData));
  }
}