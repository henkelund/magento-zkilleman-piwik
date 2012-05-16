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
}
