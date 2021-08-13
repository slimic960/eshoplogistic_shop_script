<?php

class eshoplogisticShippingApi
{
    /**
     * @var string
     */
    private $default_api_url = 'https://app5.mvita.ru/api/';
    private $api_url = '';

    /**
     * @var string
     */
    protected $api_key = '';

    /**
     * @var string
     */
    protected $widget_key = '';

    /**
     * @var string
     */
    protected $widget_secret_code = '';

    /**
     * Errors from request
     * @var string
     */
    protected $errors = null;

    /**
     * @var eshoplogisticShipping $esl
     */
    protected $esl = null;
    protected $data = array();

    public function __construct($settings = '', eshoplogisticShipping $esl = null)
    {
        $this->api_key = $settings['api_key'];
        $this->widget_key = $settings['widget_key'];
        $this->widget_secret_code = $settings['widget_secret_code'];
        $this->esl = $esl;
    }

    private function generateApiUrl($path = '')
    {
        $this->api_url = $this->default_api_url . $path;
    }

    public function saveApiKey()
    {
        if(empty($this->api_key)) {
            throw new waException('API ключ пустой');
        }

        $result = $this->infoAccount();
        if (!$result) {
            throw new waException('API ключ некорректный');
        }

    }

    public function infoAccount()
    {
        $this->generateApiUrl('site');

        $result = $this->sendRequest($this->data);
        return $result;
    }

    /**
     * @param $data
     * @return array
     */
    protected function sendRequest($data)
    {
        $options = [
            'request_format' => 'default',
            'format'         => waNet::FORMAT_JSON,
            'verify'         => false,
        ];
        $data['key'] = $this->api_key;

        $net = new waNet($options);
        try {
            $result = $net->query($this->api_url, $data, waNet::METHOD_POST);
        } catch (waException $e) {
            $result = [];
        }

        $errors = $this->setErrors($result);

        // if the error returned, then clear the array
        if (count($result) <= 0 || $errors) {
            $result = [];
        }

        return (array)$result;
    }

    /**
     * @param $result
     * @return bool
     */
    protected function setErrors($result)
    {
        if (isset($result[0]['err'])) {
            $this->errors = $result[0]['err'];
        }

        if (isset($result['err'])) {
            $this->errors = $result['err'];
        }

        return (bool)$this->errors;
    }



}