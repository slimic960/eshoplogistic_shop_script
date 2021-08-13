<?php

/**
 * Class eshoplogisticShipping
 * @property-read string token
 * @property-read string targetstart
 * @property-read string api_url
 */

class eshoplogisticShipping extends waShipping
{

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
        $prices = array();
        $price = null;
        $limit = $this->getPackageProperty($this->rate_by);

        /** @var $rates array|null массив с тарифами из "Расчета стоимости доставки" курьера */
        $rates = $this->rate;
        if (!$rates) {
            $rates = array();
        }
        foreach ($rates as $rate) {
            $rate['limit'] = floatval(preg_replace('@[^\d\.]+@', '', str_replace(',', '.', $rate['limit'])));
            if (($limit !== null)
                && ($price === null)
                && (
                    ($rate['limit'] < $limit)
                    || (($rate['limit'] == 0) && (floatval($limit) == 0))
                )
            ) {
                /** @var $price float стоимость доставки по тарифу */
                $price = $this->parseCost($rate['cost']);
            }
            $prices[] = $this->parseCost($rate['cost']);
        }

        if (($limit !== null) && ($price === null)) {
            /** доставка считается бесплатной если не указан ни один тариф */
            return false;
        }

        $delivery = array(
            'est_delivery' => '',
            'currency'     => $this->currency,
            'rate'         => ($limit === null) ? ($prices ? array(min($prices), max($prices)) : null) : $price,
            'type'         => self::TYPE_TODOOR,
        );

        $services = array();


        $delivery += array(
            'delivery_date' => '',
        );

        $delivery['est_delivery'] = '';


        $services['delivery'] = $delivery;

        return $services;
    }

    /**
     * @param waOrder $order
     * @return array
     */
    public function customFields(waOrder $order)
    {
        $shipping_params = $order->shipping_params;
        $fields = parent::customFields($order);

        $this->registerControl('EslSelectControl', array($this, 'customSelectControl'));
        $fields['delivery_control'] = array(
            'title'        => 'Вариант доставки',
            'control_type' => 'EslSelectControl',
            'data'         => array(
                'affects-rate' => true,
            ),
        );

        return $fields;
    }


    public function customSelectControl()
    {
        $dom = new DOMDocument();

        $div = $dom->createElement('div');
        $div->appendChild($dom->createTextNode('Введите несколько символов'));
        $div->appendChild($dom->createElement('br'));
        $div->appendChild($dom->createTextNode('в поле выбора доставки:'));
        $div->setAttribute('class', 'bold');
        $div->setAttribute('id', 'helpim_delivery_selected');
        $dom->appendChild($div);

        $script = $dom->createElement('script');
        $script->setAttribute('src', wa()->getUrl() . 'wa-plugins/shipping/eshoplogistic/js/eshoplogistic.js');
        $dom->appendChild($script);

        return $dom->saveHTML();
    }

    private function getCachedResult()
    {
        return wa()->getStorage()->get(self::CACHE_NAME);
    }
}