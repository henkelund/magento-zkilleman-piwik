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

class Zkilleman_Piwik_Model_Config
{
    // General
    const XML_PATH_TRACKING_ENABLED = 'piwik/general/enabled';
    const XML_PATH_PIWIK_BASE_URL   = 'piwik/general/base_url';
    const XML_PATH_PIWIK_SITE_ID    = 'piwik/general/site_id';
    const XML_PATH_PIWIK_API_TOKEN  = 'piwik/general/auth_token';
    
    // Link tracking
    const XML_PATH_LINK_TRACKING_ENABLED  = 'piwik/link_tracking/enabled';
    const XML_PATH_LINK_TRACKING_TIMER    = 'piwik/link_tracking/timer';
    const XML_PATH_LINK_TRACKING_IGNORE   = 'piwik/link_tracking/ignore_classes';
    const XML_PATH_LINK_TRACKING_OUTLINK  = 'piwik/link_tracking/outlink_classes';
    const XML_PATH_LINK_TRACKING_DOWNLOAD = 'piwik/link_tracking/download_classes';
    
    // API
    const XML_PATH_API_SEGMENT = 'segment';
    
    /**
     *
     * @var array 
     */
    protected $_segmentOptions = null;
    
    /**
     * Whether tracking is enabled
     *
     * @return bool 
     */
    public function isTrackingEnabled()
    {
        return (bool) Mage::getStoreConfig(self::XML_PATH_TRACKING_ENABLED);
    }
    
    /**
     * Get Piwik Base URL from config
     *
     * @return string 
     */
    public function getPiwikBaseUrl()
    {
        return Mage::getStoreConfig(self::XML_PATH_PIWIK_BASE_URL);
    }
    
    /**
     * Get Piwik Site ID from config
     *
     * @return int 
     */
    public function getPiwikSiteId()
    {
        return (int) Mage::getStoreConfig(self::XML_PATH_PIWIK_SITE_ID);
    }
    
    /**
     * Whether link tracking is enabled
     *
     * @return bool 
     */
    public function isLinkTrackingEnabled()
    {
        return (bool) Mage::getStoreConfig(self::XML_PATH_LINK_TRACKING_ENABLED);
    }
    
    /**
     * Get link tracking delay
     *
     * @return int 
     */
    public function getLinkTrackingTimer()
    {
        return (int) Mage::getStoreConfig(self::XML_PATH_LINK_TRACKING_TIMER);
    }
    
    /**
     * Get link css classes to be ignored
     *
     * @return array 
     */
    public function getLinkTrackingIgnoreClasses()
    {
        return $this->_cssClassStringToArray(
                    Mage::getStoreConfig(self::XML_PATH_LINK_TRACKING_IGNORE));
    }
    
    /**
     * Get link css classes to be treated as outlinks
     *
     * @return array 
     */
    public function getLinkTrackingOutlinkClasses()
    {
        return $this->_cssClassStringToArray(
                    Mage::getStoreConfig(self::XML_PATH_LINK_TRACKING_OUTLINK));
    }
    
    /**
     * Get link css classes to be treated as downloads
     *
     * @return array 
     */
    public function getLinkTrackingDownloadClasses()
    {
        return $this->_cssClassStringToArray(
                    Mage::getStoreConfig(self::XML_PATH_LINK_TRACKING_DOWNLOAD));
    }
    
    /**
     *
     * @param  string $string
     * @return array 
     */
    protected function _cssClassStringToArray($string)
    {
        return preg_split('/\s+/', $string, null, PREG_SPLIT_NO_EMPTY);
    }
    
    /**
     * Get Piwik 'token_auth'
     *
     * @return string 
     */
    public function getApiToken()
    {
        return Mage::getStoreConfig(self::XML_PATH_PIWIK_API_TOKEN);
    }
    
    /**
     *
     * @param  string $type
     * @return array 
     */
    protected function _getDefaultSegmentOperators($type)
    {
        $operators = null;
        $helper    = Mage::helper('piwik');
        
        switch ($type) {
            case 'select':
                $operators = array(
                    '==' => $helper->__('is'),
                    '!=' => $helper->__('is not')
                );
                break;
            default:
                $operators = array(
                    '==' => $helper->__('equals'),
                    '!=' => $helper->__('does not equal'),
                    '<=' => $helper->__('is less than or equal to'),
                    '<'  => $helper->__('is less than'),
                    '>=' => $helper->__('is greater than or equal to'),
                    '>'  => $helper->__('is greater than'),
                    '=@' => $helper->__('contains'),
                    '!@' => $helper->__('does not contain')
                );
                break;
        }
        return $operators;
    }
    
    /**
     * Get segmentation options
     *
     * @return array 
     */
    public function getSegments()
    {
        if ($this->_segmentOptions == null) {
            $config = Mage::getConfig()->loadModulesConfiguration('piwik.xml');
            $helper = Mage::helper('piwik');
            $this->_segmentOptions = $config
                                        ->getNode(self::XML_PATH_API_SEGMENT)
                                        ->asArray();
            
            foreach ($this->_segmentOptions as $code => &$info) {
                $info['code']  = $code;
                $info['label'] = isset($info['label']) ? 
                                            $helper->__($info['label']) :
                                            $helper->__($info['code'] . '_label');
                $info['group'] = isset($info['group']) ? 
                                            $helper->__($info['group']) :
                                            $helper->__('General');
                $info['type'] = (isset($info['type']) &&
                                    $info['type'] == 'select') ?
                                                        'select' : 'text';
                if ($info['type'] == 'select' &&
                        (!isset($info['values']) ||
                         !is_array($info['values']))) {
                    $info['values'] = array();
                }
                
                if ($info['type'] == 'select') {
                    $values = array();
                    foreach ($info['values'] as $value) {
                        if (is_array($value) && isset($value['value'])) {
                            $values[$value['value']] = $helper->__(
                                    isset($value['label']) ?
                                        $value['label'] :
                                        $value['value'] . '_label');
                        }
                    }
                    $info['values'] = $values;
                }
                
                if (!isset($value['operators']) ||
                        !is_array($value['operators'])) {
                    $info['operators'] =
                        $this->_getDefaultSegmentOperators($info['type']);
                }
            }
        }
        return $this->_segmentOptions;
    }
}
