<?php

class eshoplogisticOrder extends shopPlugin
{

    public function frontendOrder($params)
    {
        $checkout_config = $params['config'];
        $html = '<span>TEST</span>'; //логика формирования HTML-кода для отображения списка брендов
        return $html;
    }

    public function frontendOrderCartVars($params)
    {
        //логика формирования массива фрагментов HTML-кода для отображения на веб-странице
        //каждый из этих фрагментов будет вставлен в место, предусмотренное для него темой дизайна (если метод подключен к хуку фронтенда — например, к хуку frontend_product) или шаблоном бекенда
        $data = array(
            'menu' => '...', //фрагмент HTML-кода
            'cart' => '...', //фрагмент HTML-кода
            'block' => '...', //фрагмент HTML-кода
            'block_aux' => '...', //фрагмент HTML-кода
        );
        return $data;
    }

}