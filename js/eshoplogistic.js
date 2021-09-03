let esl = {
    items: {
        widget_id: 'eShopLogisticStatic',
        esldata_field_id: 'wahtmlcontrol_details_custom_widget_city_esl',
        esldata_to_id: 'js-city-field',
        esldata_offers_id: 'wahtmlcontrol_details_custom_widget_offers_esl',
        esldata_deliveries_id: 'wahtmlcontrol_details_custom_esldata_deliveries',
        no_delivery_id: 'pickup',
        payments: 'cashless',
        esl_search_block_id: 'esl_search_block'
    },
    current: {payment_id: null, delivery_id: null},
    widget_offers: '',
    widget_city: {name: null, type: null, fias: null, services: {}},
    widget_payment: {key: ''},
    form: window.waOrder.form,
    prev_action: '',
    request: function (action) {
        return new Promise(function (resolve, reject) {
            if (!window.eslOrder) {
                window.eslOrder = esl;
            }
            console.log(window.eslOrder.prev_action)
            console.log(action)

            if (window.eslOrder.prev_action !== action) {
                window.eslOrder.prev_action = action
                esl.form.update({
                    "data": [
                        {
                            "name": "use_session_input",
                            "value": "1"
                        },
                        {
                            "name": "esljson",
                            "value": "1"
                        },
                        {
                            "name": "esldata",
                            "value": action
                        },
                    ]
                })
            }

        })
    },
    check: function () {
        const elements = ['widget_id', 'no_delivery_id', 'esldata_to_id', 'esldata_deliveries_id'],
            current_payment = document.querySelector('input[name=payment]:checked'),
            current_delivery = document.querySelector('input[name=delivery]:checked')


        let check = true

        return check
    },
    prepare: function () {
        const to = JSON.parse(document.getElementById(this.items.esldata_field_id).value),
            offers = document.getElementById(this.items.esldata_offers_id).value,
            services = '1',
            payments = this.items.payments


        this.widget_offers = offers
        this.widget_city.type = to.type
        this.widget_city.name = to.name
        this.widget_city.fias = to.fias
        this.widget_city.services = to.services
        this.widget_payment.key = 'card'
    },
    run: async function (reload = '') {

        if (!this.check()) {
            return false
        }

        const widget = document.getElementById(this.items.widget_id)

        this.prepare()

        let detail = {
            city: this.widget_city,
            payment: this.widget_payment,
            offers: this.widget_offers
        }

        if (reload.length != 0) {
            switch (reload) {
                case 'offers':
                    let offers = await this.request('cart=1')
                    detail = {
                        offers: JSON.stringify(offers)
                    }
                    break
                case 'payment':
                    detail = {
                        payment: this.widget_payment
                    }
                    break
                case 'city':
                    detail = {
                        city: this.widget_city
                    }
                    break
            }
            widget.dispatchEvent(new CustomEvent('eShopLogistic:reload', {detail}))
        } else {
            console.log(detail);
            widget.dispatchEvent(new CustomEvent('eShopLogistic:load', {detail}))
        }
    },
    confirm: async function (response) {

        const esldata_deliveries = JSON.parse(document.getElementById(this.items.esldata_deliveries_id).value)
        ms_delivery_item = document.getElementById('delivery_' + esldata_deliveries[response.keyDelivery]),
            current_delivery = document.querySelector('input[name=delivery]:checked'),
            delivery_info_elements = ['mode', 'time', 'service', 'address', 'comment', 'payment', 'payment-comment']

        document.getElementById('wahtmlcontrol_details_custom_widget_terminal_esl').value = ''

        esldata = {
            price: 0,
            time: '',
            name: response.name,
            key: response.keyShipper,
            mode: response.keyDelivery,
            address: '',
            comment: ''
        }

        if (response.comment) {
            esldata.comment = response.comment
        }

        if (response.keyDelivery === 'postrf') {
            esldata.price = response.terminal.price
            esldata.time = response.terminal.time
            if (response.terminal.comment) {
                esldata.comment += '<br>' + response.terminal.comment
            }
        } else {
            esldata.price = response[response.keyDelivery].price
            esldata.time = response[response.keyDelivery].time
            if (response[response.keyDelivery].comment) {
                esldata.comment += '<br>' + response[response.keyDelivery].comment
            }
        }

        if (response.deliveryAddress) {
            esldata.address = response.deliveryAddress.code + ' ' + response.deliveryAddress.address
        } else {
            if (response.currentAddress) {
                esldata.address = response.currentAddress
            }
        }


        let result = await this.request(JSON.stringify(esldata))

        if (current_delivery !== ms_delivery_item) {
            ms_delivery_item.click()
        } else {
            miniShop2.Order.add('delivery', esldata_deliveries[response.keyDelivery])
        }

    },
    setTerminal: function (response) {
        const terminal = document.getElementById('wahtmlcontrol_details_custom_widget_terminal_esl'),
            info = document.getElementById('esl-info-address')
        if (response.keyDelivery == 'terminal') {
            terminal.value = response.deliveryAddress.code + ' ' + response.deliveryAddress.address
            if (info) {
                setTimeout(function () {
                    info.innerHTML = response.deliveryAddress.address
                }, 500)
            }
        } else {
            if (info) {
                info.parentElement.style.display = 'none'
            }
            terminal.value = ''
        }
    },
    error: function (response) {
        console.log('Ошибка виджета, включен дефолтный режим доставки', response)
        document.getElementById(this.items.widget_id).style.display = 'none'
        const no_delivery = document.getElementById(this.items.no_delivery_id)
        no_delivery.parentElement.style.display = 'block'
        no_delivery.click()
    },
    search: async function (text) {

        const _self = this,
            ms_city_block = document.getElementById('city').parentElement

        let result = await this.request('text=' + text),
            html = ''

        if (typeof result == 'object') {
            if (result.length > 0) {

                html = '<p>' + eshoplogistic2Config.select_city + '</p><ul>'
                for (let item in result) {
                    let obj = result[item]
                    html += '<li><a href="#" data-services=\'' + JSON.stringify(obj.services) + '\' data-fias="' + obj.fias + '" data-city="' + obj.name + '" data-index="' + obj.index + '">' + obj.target + '</a></li>'
                }
                html += '<ul>'

                if (sl_search_block = document.getElementById(this.items.esl_search_block_id)) {
                    esl_search_block.innerHTML = html
                    esl_search_block.style.display = 'block'
                } else {
                    let new_esl_search_block = document.createElement('div')
                    new_esl_search_block.setAttribute('id', this.items.esl_search_block_id)
                    new_esl_search_block.innerHTML = html
                    ms_city_block.appendChild(new_esl_search_block)
                    esl_search_block = document.getElementById(this.items.esl_search_block_id)
                }

                let cityLinks = document.querySelectorAll('#' + this.items.esl_search_block_id + ' a')

                cityLinks.forEach.call(cityLinks, function (el) {
                    el.addEventListener('click', event => {
                        event.preventDefault()
                        let fields = ['fias', 'index', 'city']

                        fields.forEach(elem => {
                            let field = document.getElementById(elem)
                            if (field) {
                                field.value = el.dataset[elem]
                                miniShop2.Order.add(elem, el.dataset[elem])
                            }
                        });
                        esl_search_block.style.display = 'none'

                        document.getElementById(_self.items.esldata_to_id).value = '{"fias":"' + el.dataset['fias'] + '","name":"' + el.dataset['city'] + '","type":"","services":' + el.dataset['services'] + '}'
                        esl.run('city')
                    });
                })
            }
        }
    }
}


function eslRun() {
    // скроем все варианты доставки ms2
    const ms_deliveries = document.getElementById('js-delivery-variants-section')
    //ms_deliveries.style.display = 'none'
    esl.run()
}

document.addEventListener('eShopLogistic:ready', () => {
    eShopLogistic.onSelectedPVZ = function (response) {
        console.log('onSelectedPVZ', response)
        esl.setTerminal(response)
    }
    eShopLogistic.onError = function (response) {
        esl.error(response)
        document.dispatchEvent(new CustomEvent('esl2onError', {detail: response}))
    }
    eShopLogistic.onSelectedService = function (response) {
        console.log('onSelectedService', response)
        esl.confirm(response)
        document.dispatchEvent(new CustomEvent('esl2onSelectedService', {detail: response}))
        window.eslForm = document.getElementById('eShopLogisticStatic').cloneNode(true);
    }
})

setTimeout(eslRun, 1000)

