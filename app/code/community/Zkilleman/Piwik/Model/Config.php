<?php
/**
 * Zkilleman_Piwik
 *
 * Copyright (C) 2012 Henrik Hedelund (henke.hedelund@gmail.com)
 *
 * This file is part of Zkilleman_Piwik.
 *
 * Zkilleman_Piwik is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Zkilleman_Piwik is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Zkilleman_Piwik. If not, see <http://www.gnu.org/licenses/>.
 *
 * @category Zkilleman
 * @package Zkilleman_Piwik
 * @author Henrik Hedelund <henke.hedelund@gmail.com>
 * @copyright 2012 Henrik Hedelund (henke.hedelund@gmail.com)
 * @license http://www.gnu.org/licenses/gpl.html GNU GPL
 * @link https://github.com/henkelund/magento-zkilleman-piwik
 */

class Zkilleman_Piwik_Model_Config
{
    const XML_PATH_TRACKING_ENABLED = 'piwik/general/enabled';
    const XML_PATH_PIWIK_BASE_URL   = 'piwik/general/base_url';
    const XML_PATH_PIWIK_SITE_ID    = 'piwik/general/site_id';
    
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
     * @return string 
     */
    public function getPiwikSiteId()
    {
        return (int) Mage::getStoreConfig(self::XML_PATH_PIWIK_SITE_ID);
    }
}
