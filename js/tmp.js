window.addEventListener('load', function(event) {
    eslRun()
});
let onLoad = () => {
    alert(1);
    const appRoot = document.getElementById('eShopLogisticStatic')
    const propsCity = {
        fias: "c52ea942-555e-45c6-9751-58897717b02f",
        name: "Тверь",
        postal_code: "170000",
        rank: 2,
        region: "Тверская область",
        services: {
            baikal: "c52ea942-555e-45c6-9751-58897717b02f",
            boxberry: "55",
            delline: "6900000100000000000000000",
            dpd: "195730113",
            gtd: "690000100000",
            iml: "ТВЕРЬ",
            pecom: "175508",
            sdek: "245"
        }
    };
    console.log(appRoot);
    const offers = '[{"article":"1","name":"Товар 1","count":"2","price":"300.25","weight":"2.4"}]'
    const payment = {
        key: 'cashless',
        name: "Безналичный расчёт",
        comment: null,
        active: true
    }
    appRoot.dispatchEvent(new CustomEvent('eShopLogistic:load', {
        detail: {
            city: propsCity,
            payment,
            offers
        }
    }))
}
//setTimeout(onLoad,4000)
let esl = {
    items: {
        widget_id: 'eShopLogisticStatic',
        esldata_field_id: 'esldata',
        esldata_to_id: 'esldata_to',
        esldata_offers_id: 'esldata_offers',
        esldata_deliveries_id: 'esldata_deliveries',
        no_delivery_id: 'delivery_' + eshoplogistic2Config.no_delivery_id,
        payments: JSON.parse(eshoplogistic2Config.payments),
        esl_search_block_id: 'esl_search_block'
    },
    current: { payment_id: null, delivery_id: null },
    widget_offers: '',
    widget_city: { name: null, type: null, fias: null, services: {} },
    widget_payment: { key: '' },
    request: function (action) {
        return new Promise(function (resolve, reject) {
            const request = new XMLHttpRequest()
            request.open('POST', eshoplogistic2Config.actionUrl, true)
            request.responseType = 'json'
            request.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
            request.setRequestHeader("Content-type", "application/x-www-form-urlencoded")
            request.send(action)
            request.addEventListener("readystatechange", () => {
                if (request.readyState === 4 && request.status === 200) {
                    resolve(request.response)
                }
            })
        })
    },
    check: function () {
        const elements = ['widget_id','no_delivery_id','esldata_to_id','esldata_deliveries_id'],
            current_payment = document.querySelector('input[name=payment]:checked'),
            current_delivery = document.querySelector('input[name=delivery]:checked')

        let check = true

        elements.forEach(element => {
            if(!document.getElementById(this.items[element])) {
                if(element == 'no_delivery_id') {
                    console.log('Для работы модуля eShopLogistic включите способ доставки по умолчанию [id="' + this.items.no_delivery_id + '"]')
                } else {
                    console.log('Для работы модуля eShopLogistic необходим элемент [id="' + this.items[element] + '"]')
                }
                check = false
            }
        });

        if(!current_payment) {
            console.log('Нет ни одного варианта оплаты')
            check = false
        } else {
            this.current.payment_id = current_payment.id
        }

        if(!current_delivery) {
            console.log('Нет ни одного варианта доставки')
            check = false
        } else {
            this.current.delivery_id = current_delivery.id
        }

        return check
    },
    prepare: function () {
        const to = JSON.parse(document.getElementById(this.items.esldata_to_id).value),
            offers = document.getElementById(this.items.esldata_offers_id).value,
            services = JSON.parse(document.getElementById(this.items.esldata_deliveries_id).value),
            payments = this.items.payments

        this.widget_offers = offers
        this.widget_city.type = to.type
        this.widget_city.name = to.name
        this.widget_city.fias = to.fias
        this.widget_city.services = to.services

        let current_payment = this.current.payment_id.match(/(\d)/)
        if(current_payment[0]) {
            for (const [key, value] of Object.entries(this.items.payments)) {
                if(value.indexOf(current_payment[0]) != -1) {
                    this.widget_payment.key = key
                }
            }
        }
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

        if(reload.length != 0) {
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
        }
        else {
            widget.dispatchEvent(new CustomEvent('eShopLogistic:load', {detail}))
        }
    },
    confirm:  async function (response) {
        const esldata_field = document.getElementById(this.items.esloutdata_field_id),
            esldata_deliveries = JSON.parse(document.getElementById(this.items.esldata_deliveries_id).value)
        ms_delivery = esldata_deliveries[response.keyDelivery],
            ms_delivery_item = document.getElementById('delivery_' + esldata_deliveries[response.keyDelivery]),
            current_delivery = document.querySelector('input[name=delivery]:checked'),
            delivery_info_elements = ['mode', 'time', 'service', 'address', 'comment', 'payment', 'payment-comment']

        document.getElementById('terminal').value = ''

        if(typeof ms_delivery != 'undefined') {
            if(!ms_delivery_item) {
                ms_delivery = false
            }
        } else {
            ms_delivery = false
        }

        if(!ms_delivery) {
            console.log('Не найден способ датсавки с id = delivery_' + esldata_deliveries[response.keyDelivery])
            this.error({})
            return
        }

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

        if(response.keyDelivery === 'postrf') {
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



        let result = await this.request('delivery='+JSON.stringify(esldata))

        if(current_delivery !== ms_delivery_item) {
            ms_delivery_item.click()
        } else {
            miniShop2.Order.add('delivery', esldata_deliveries[response.keyDelivery])
        }

        delivery_info_elements.forEach(element => {
            let element_display = true
            if(el = document.getElementById('esl-info-' + element)) {
                switch (element) {
                    case 'payment-comment':
                        element_display = false
                        if (response.payments.length > 0) {
                            let current_payment = this.current.payment_id.match(/(\d)/)
                            if (current_payment[0]) {
                                for (const [key, value] of Object.entries(this.items.payments)) {
                                    if (value.indexOf(current_payment[0]) != -1) {
                                        for (const [key1, value1] of Object.entries(response.payments)) {
                                            if (value1.key == key && value1.comment) {
                                                el.innerHTML = value1.comment
                                                element_display = true
                                                break
                                            }
                                        }
                                        break
                                    }
                                }
                            }
                        }
                        break
                    case 'comment':
                        if(esldata.comment.length > 0) {
                            el.innerHTML = esldata.comment
                        } else {
                            element_display = false
                        }
                        break
                    case 'address':
                        if(response.keyDelivery == 'terminal') {
                            el.innerHTML = eshoplogistic2Config.empty_pvz
                        } else {
                            element_display = false
                        }
                        break
                    default:
                        el.innerHTML = result[element]
                }

                if(element_display) {
                    el.parentElement.style.display = 'block'
                } else {
                    el.parentElement.style.display = 'none'
                }
            }
        })

    },
    setTerminal: function (response) {
        const terminal = document.getElementById('terminal'),
            info = document.getElementById('esl-info-address')
        if(response.keyDelivery == 'terminal') {
            terminal.value = response.deliveryAddress.code + ' ' + response.deliveryAddress.address
            if(info) {
                setTimeout(function () {
                    info.innerHTML = response.deliveryAddress.address
                }, 500)
            }
        } else {
            if(info) {
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

        let result = await this.request('text='+text),
            html = ''

        if(typeof result == 'object') {
            if(result.length > 0) {

                html = '<p>' + eshoplogistic2Config.select_city + '</p><ul>'
                for( let item in result ){
                    let obj = result[item]
                    html += '<li><a href="#" data-services=\''+JSON.stringify(obj.services)+'\' data-fias="'+obj.fias+'" data-city="'+obj.name+'" data-index="'+obj.index+'">'+obj.target+'</a></li>'
                }
                html += '<ul>'

                if(sl_search_block = document.getElementById(this.items.esl_search_block_id)) {
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

                cityLinks.forEach.call(cityLinks, function(el){
                    el.addEventListener('click', event => {
                        event.preventDefault()
                        let fields = ['fias','index','city']

                        fields.forEach(elem => {
                            let field = document.getElementById(elem)
                            if(field) {
                                field.value = el.dataset[elem]
                                miniShop2.Order.add(elem, el.dataset[elem])
                            }
                        });
                        esl_search_block.style.display = 'none'

                        document.getElementById(_self.items.esldata_to_id).value = '{"fias":"'+el.dataset['fias']+'","name":"'+el.dataset['city']+'","type":"","services":'+el.dataset['services']+'}'
                        esl.run('city')
                    });
                })
            }
        }
    }
}


function eslRun() {

    // скроем все варианты доставки ms2
    const ms_deliveries = document.querySelectorAll('[name="delivery"]')
    ms_deliveries.forEach.call(ms_deliveries, function(el){
        el.parentElement.style.display = 'none'
    })

    // блокируем автозаполнение города
    document.getElementById('city').setAttribute('autocomplete', 'esl-city')

    esl.run()

    miniShop2.Callbacks.add('Order.add.response.success', 'eShopLogisticOrderAdd', function (response) {
        if(eshoplogistic2Config.payment_on == 1) {
            if(typeof response.data.payment == 'string') {
                esl.run('payment')
            }
        }
    })
    miniShop2.Callbacks.add('Cart.change.response.success', 'eShopLogisticCartChange', function (response) {
        esl.run('offers')
    })
    miniShop2.Callbacks.add('Cart.remove.response.success', 'eShopLogisticCartRemove', function (response) {
        esl.run('offers')
    })
}

document.body.addEventListener("click", function(){
    const search_block = document.getElementById(esl.items.esl_search_block_id)
    if(search_block) {
        search_block.style.display = 'none'
    }
})

document.getElementById('city').oninput = function() {
    if(this.value.length >= 3) {
        esl.search(this.value)
    }
}

document.addEventListener('eShopLogistic:ready', () => {
    eShopLogistic.onSelectedPVZ = function (response) {
        console.log('onSelectedPVZ', response)
        esl.setTerminal(response)
    }
    eShopLogistic.onError = function (response) {
        esl.error(response)
        document.dispatchEvent(new CustomEvent('esl2onError', {detail: response }))
    }
    eShopLogistic.onSelectedService = function (response) {
        console.log('onSelectedService', response)
        esl.confirm(response)
        document.dispatchEvent(new CustomEvent('esl2onSelectedService', {detail: response }))
    }
    eShopLogistic.onSelectedCity = function (response) {
        console.log('onSelectedCity', response)
        document.getElementById('city').value = response.name
        miniShop2.Order.add('city', response.name)
    }
})
