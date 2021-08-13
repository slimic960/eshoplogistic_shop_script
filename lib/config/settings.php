<?php
return array(
    'service' => array(
        'value' => 'Eshoplogistic'
    ),
    'widget_key' => array(
        'value' => ''
    ),
    'widget_secret_code' => array(
        'value' => ''
    ),
    'required_address_fields' => array(
        'title'        => 'Обязательные поля адреса',
        'control_type' => waHtmlControl::GROUPBOX,
        'options'      => array(
            array(
                'value' => 'zip',
                'title' => 'Почтовый индекс',
            ),
            array(
                'value' => 'street',
                'title' => 'Улица, дом, квартира',
            ),
        ),
        'description'  => 'Выберите поля адреса, которые должны быть обязательны для заполнения.<br><br>',
    ),
);
