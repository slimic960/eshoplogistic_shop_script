<?php

/**
 * Class eshoplogisticShipping
 * @property-read string api_url
 * @property-read string api_key
 * @property-read string widget_key
 * @property-read string widget_secret_code
 */

class eshoplogisticShipping extends waShipping
{
    private $dataTmp = array();
    private $serviceList = array();

    private static $deliveryType = array(
        'courier' => 'Курьер',
        'selfDelivery' => 'Самовывоз',
    );

    public function getPluginPath()
    {
        return $this->path;
    }


    public function getSettingsHTML($params = array())
    {
        $settings = new eshoplogisticShippingGetSettings($this);

        $html = $settings->getHtml($params);
        $html .= parent::getSettingsHTML($params);

        return $html;
    }

    public function saveSettings($settings = array())
    {
        $api_settings = new eshoplogisticShippingApi($settings, $this);
        $api_settings->saveApiKey();

        return parent::saveSettings($settings);
    }

    public function requestedAddressFields()
    {
        return array(
            'zip'     => array('cost' => false),
            'street'  => array('cost' => false),
            'city'    => array('cost' => false),
            'country' => array('cost' => true),
        );
    }

    public function allowedAddress()
    {
        return array(
            array(
                'country' => 'rus',
            ),
        );
    }

    public function allowedCurrency()
    {
        return 'RUB';
    }

    public function allowedWeightUnit()
    {
        return 'kg';
    }


    protected function calculate($params = array())
    {

        $price = 0;
        $name = '';
        $time = '';
        if (isset($_POST['esljson']) && $_POST['esljson'] == '1') {
            $data = json_decode($_POST['esldata']);
            if(isset($data->price)){
                $price = $data->price;
                $name = $data->name;
                $time = $data->time;
            }


        }
        $services = array(
            'pickup' => array(
                'name' => 'Выбрать ПВЗ',
                'est_delivery' => $time,
                'description' => 'ПВЗ',
                'currency'     => 'RUB',
                'rate'         => $price,
                'type'         =>  self::TYPE_PICKUP,
                'service' => $name,
            ),
            'delivery' => array(
                'name' => 'Курьер',
                'est_delivery' => $time,
                'description' => 'Курьер',
                'currency'     =>  'RUB',
                'rate'         => $price,
                'type'         =>  self::TYPE_TODOOR,
                'service' => $name,
            ),
            'post' => array(
                'name' => 'Почта',
                'est_delivery' => $time,
                'description' => 'Курьер',
                'currency'     =>  'RUB',
                'rate'         => $price,
                'type'         =>  self::TYPE_POST,
                'service' => $name,
            )

        );

        return $services;
    }

    /**
     * @param waOrder $order
     * @return array
     */
    public function customFields(waOrder $order)
    {
        $shipping_params = $order->shipping_params;
        $shipping_address = $order->shipping_address;
        $api = new eshoplogisticShippingApi($this->getSettings());
        $city = $api->getByApiMethod('target', $shipping_address);
        $info = $api->getByApiMethod('info');


        $fields = parent::customFields($order);
        self::calculate();

        $services = array();
        foreach ($info['services'] as $key=>$item){
            $services[$key] = $item['city_code'];
        }

        $this->dataTmp['city'] = array(
            'fias' => $city['fias'],
            'name' => $city['target'],
            'type' => $city['type'],
            'services' => $services
        );

        foreach ($order->items as $key=>$item){
            $product = new shopProduct($item['product_id']);
            $features = $product->getFeatures();

            $this->dataTmp['offers'][] = array(
                'article' => $item['product_id'],
                'name' => $item['name'],
                'count' => $item['quantity'],
                'price' => $item['price'],
                'weight' => isset($features['weight']->value)?$features['weight']->value:1,
            );
        }

        $fields['widget_city_esl'] = array(
            'control_type' => waHtmlControl::HIDDEN,
            'value' => json_encode($this->dataTmp['city']),
        );
        $fields['widget_offers_esl'] = array(
            'control_type' => waHtmlControl::HIDDEN,
            'value' => json_encode($this->dataTmp['offers']),
        );
        $fields['esldata_deliveries'] = array(
            'control_type' =>  waHtmlControl::HIDDEN,
            'value'        =>  json_encode(array(self::TYPE_PICKUP,self::TYPE_TODOOR,self::TYPE_POST)),
        );
        $fields['widget_terminal_esl'] = array(
            'control_type' =>  waHtmlControl::INPUT,
            'title'        => 'Пункт самовывоза',
        );
        $this->registerControl('EslSelectControl', array($this, 'customSelectControl'));
        $fields['delivery_control'] = array(
            'control_type' => 'EslSelectControl',
        );

        return $fields;
    }

    public function customSelectTrariffControl()
    {
        $url_params = array(
            'action_id' => 'getTariffList',
            'plugin_id' => $this->key,
        );
        $url = wa()->getRouteUrl($this->app_id . '/frontend/shippingPlugin', $url_params, true);

        $currency = waCurrency::getInfo(wa()->getSetting('currency'));

        $dom = new DOMDocument();

        $div = $dom->createElement('div');
        $div->appendChild($dom->createTextNode('Введите несколько символов'));
        $div->appendChild($dom->createElement('br'));
        $div->appendChild($dom->createTextNode('в поле выбора доставки:'));
        $div->setAttribute('class', 'bold');
        $div->setAttribute('id', 'helpim_delivery_selected');
        $dom->appendChild($div);

        /* Delivery type checkbox group */
        $div = $dom->createElement('div');
        $div->setAttribute('id', 'helpim_delivery_type_groupbox');
        $div->appendChild($dom->createTextNode('Способ доставки'));
        foreach (self::$deliveryType as $type => $name) {
            $label = $dom->createElement('label');
            $checkbox = $dom->createElement('input');
            $checkbox->setAttribute('type', 'checkbox');
            $checkbox->setAttribute('name', $type);
            $checkbox->setAttribute('checked', true);
            $label->appendChild($checkbox);
            $label->appendChild($dom->createTextNode($name));
            $div->appendChild($label);
        }
        $dom->appendChild($div);

        /* Delivery service checkbox group */
        $div = $dom->createElement('div');
        $div->setAttribute('id', 'helpim_delivery_service_groupbox');
        $div->appendChild($dom->createTextNode('Сервис доставки'));
        foreach ($this->serviceList as $service => $name) {
            $label = $dom->createElement('label');
            $checkbox = $dom->createElement('input');
            $checkbox->setAttribute('type', 'checkbox');
            $checkbox->setAttribute('name', $service);
            $checkbox->setAttribute('checked', true);
            $label->appendChild($checkbox);
            $label->appendChild($dom->createTextNode($name));
            $div->appendChild($label);
        }
        $dom->appendChild($div);

        /* Delivery tariff list */
        $div = $dom->createElement('div');
        $div->setAttribute('id', 'helpim_delivery_tariff_list');
        $input = $dom->createElement('input');
        $input->setAttribute('class', 'long');
        $input->setAttribute('placeholder', 'Выбор способа доставки');
        $div->appendChild($input);
        $dom->appendChild($div);

        /* Map */
        $div = $dom->createElement('div', 'ПВЗ на карте:');
        $dom->appendChild($div);
        $div = $dom->createElement('div');
        $div->setAttribute('id', 'helpim_delivery_map');
        $dom->appendChild($div);

        $script = $dom->createElement('script', "
            /* Decode entity */
            function d(str) {
                return $('<p>' + str + '</p>').text();
            }

            var getTariffListUrl = '{$url}',
            pluginId = {$this->key},
            currency = d('" . $currency['sign'] . "'),
            deliveryType = {
                courier: d('Курьер'),
                selfDelivery: d('Самовывоз'),
            };");
        $dom->appendChild($script);


        return $dom->saveHTML();
    }



    public function customSelectControl()
    {
        $widgetKey = $this->getSettings('widget_key');

        if($widgetKey){
            $dom = new DOMDocument();
            $widgetKey = '1788566-24-14:e355c3fbba509d233e9eef24849f1253';
            $div = $dom->createElement('div');
            $div->setAttribute('id', 'eShopLogisticStatic');
            $div->setAttribute('data-key', $widgetKey);
            $div->setAttribute('data-dev', '1');
            $dom->appendChild($div);

            $script = $dom->createElement('script');
            $script->setAttribute('src', wa()->getUrl() . 'wa-plugins/shipping/eshoplogistic/js/eshoplogistic.js');
            $dom->appendChild($script);

            $script = $dom->createElement('script');
            $script->setAttribute('src', 'https://app4.mvita.ru/widget_cart/js/chunk-vendors.js');
            $dom->appendChild($script);

            $script = $dom->createElement('script');
            $script->setAttribute('src', 'https://app4.mvita.ru/widget_cart/js/app.js');
            $dom->appendChild($script);

            $link = $dom->createElement('link');
            $link->setAttribute('rel', 'stylesheet');
            $link->setAttribute('type', 'text/css');
            $link->setAttribute('href', 'https://app4.mvita.ru/widget_cart/css/app.css');
            $dom->appendChild($link);


            return $dom->saveHTML();
        }
    }

    private function getCachedResult()
    {
        return wa()->getStorage()->get(self::CACHE_NAME);
    }


}