<?php

class eshoplogisticShippingActions extends waJsonActions
{

    public function testAction()
    {

        $test = $this->plugin;

        $this->display(array(
            'obj' => $this->plugin,
            'countries' => '1',
            'selected_countries' => '2',
        ));
    }

}