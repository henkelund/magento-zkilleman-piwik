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

class Zkilleman_Piwik_Block_Tracker extends Mage_Core_Block_Template
{
    
    /**
     *
     * @var string Template 
     */
    protected $_template = 'piwik/tracker.phtml';
    
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
     * @return bool 
     */
    public function isEnabled()
    {
        return $this->_config->isTrackingEnabled() &&
                        strlen($this->getBaseUrl()) > 0;
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
     * @return bool 
     */
    public function trackLinks()
    {
        return $this->_config->isLinkTrackingEnabled();
    }
    
    /**
     *
     * @return int 
     */
    public function getLinkDelay()
    {
        return $this->_config->getLinkTrackingTimer();
    }
    
    /**
     *
     * @return string 
     */
    public function getLinkIgnoreJson()
    {
        return Mage::helper('core')->jsonEncode(
                        $this->_config->getLinkTrackingIgnoreClasses());
    }
    
    /**
     *
     * @return string 
     */
    public function getLinkOutlinkJson()
    {
        return Mage::helper('core')->jsonEncode(
                        $this->_config->getLinkTrackingOutlinkClasses());
    }
    
    /**
     *
     * @return string 
     */
    public function getLinkDownloadJson()
    {
        return Mage::helper('core')->jsonEncode(
                        $this->_config->getLinkTrackingDownloadClasses());
    }
    
    /**
     * A collection of data for transaction tracking
     *
     * @see    http://piwik.org/docs/ecommerce-analytics/
     * @return Varien_Data_Collection 
     */
    public function getOrders()
    {
        $result = new Varien_Data_Collection();
        $orderIds = $this->getOrderIds();
        if (empty($orderIds) || !is_array($orderIds)) {
            return $result;
        }
        $collection = Mage::getResourceModel('sales/order_collection')
                        ->addFieldToFilter(
                                'entity_id', array('in' => $orderIds));
        foreach ($collection as $order) {
            // Gather order items data
            $items = new Varien_Data_Collection();
            foreach ($order->getAllVisibleItems() as $item) {
                $items->addItem(
                        new Varien_Object(array(
                            'sku'   => $this->jsQuoteEscape($item->getSku()),
                            'name'  => $this->jsQuoteEscape($item->getName()),
                            'price' => $item->getBasePrice(),
                            'qty'   => $item->getQtyOrdered()
                        ))
                );
            }
            // Prepare order tracking data
            $result->addItem(
                    new Varien_Object(array(
                            'id'          => $order->getIncrementId(),
                            'grand_total' => $order->getBaseGrandTotal(),
                            'sub_total'   => $order->getBaseSubtotalInclTax(),
                            'tax'         => $order->getBaseTaxAmount(),
                            'shipping'    => $order->getBaseShippingAmount(),
                            'discount'    => $order->getBaseDiscountAmount(),
                            'items'       => $items
                    ))
            );
        }
        return $result;
    }
    
    /**
     *
     * @return string 
     */
    protected function _toHtml()
    {
        if ($this->isEnabled()) {
            return parent::_toHtml();
        } else {
            return '';
        }
    }
}
