<?php
/**
 * Zkilleman_Piwik
 *
 * Copyright (C) 2012 Henrik Hedelund (henke.hedelund@gmail.com)
 *
 * This file is part of Zkilleman_Piwik.
 *
 * Zkilleman_Piwik is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Zkilleman_Piwik is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Zkilleman_Piwik. If not, see <http://www.gnu.org/licenses/>.
 *
 * @category Zkilleman
 * @package Zkilleman_Piwik
 * @author Henrik Hedelund <henke.hedelund@gmail.com>
 * @copyright 2012 Henrik Hedelund (henke.hedelund@gmail.com)
 * @license http://www.gnu.org/licenses/lgpl.html GNU LGPL
 * @link https://github.com/henkelund/magento-zkilleman-piwik
 */

class Zkilleman_Piwik_Block_Adminhtml_Dashboard
            extends Mage_Adminhtml_Block_Template
{
    
    /**
     *
     * @var Zkilleman_Piwik_Model_Config 
     */
    protected $_config;
    
    /**
     * Internal constructor
     * 
     */
    protected function _construct()
    {
        $this->_config = Mage::getSingleton('piwik/config');
        parent::_construct();
    }
    
    /**
     *
     * @return string
     */
    public function getBaseUrl()
    {
        return $this->_config->getPiwikBaseUrl();
    }
    
    /**
     *
     * @return int 
     */
    public function getSiteId()
    {
        return $this->_config->getPiwikSiteId();
    }
    
    /**
     *
     * @return string 
     */
    public function getAuthToken()
    {
        return $this->_config->getApiToken();
    }
    
    /**
     *
     * @return array 
     */
    public function getTimespanOptions()
    {
        $helper = Mage::helper('piwik');
        return array(
            '86400' => $helper->__('Last 24 hours'),
            '43200' => $helper->__('Last 12 hours'),
            '21600' => $helper->__('Last 6 hours'),
            '10800' => $helper->__('Last 3 hours'),
            '3600'  => $helper->__('Last hour'),
            '1800'  => $helper->__('Last 30 minutes'),
            '900'   => $helper->__('Last 15 minutes'),
            '300'   => $helper->__('Last 5 minutes'),
            '60'    => $helper->__('Last minute')
        );
    }
}