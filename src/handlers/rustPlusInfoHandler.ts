/*
    Copyright (C) 2025 Alexander Emanuelsson (alexemanuelol)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

    https://github.com/alexemanuelol/rustplusplus

*/

import * as rp from 'rustplus-ts';

import { log } from '../../index';
import { RustPlusInstance } from "../managers/rustPlusManager";
import { RustPlusInfo } from '../structures/rustPlusInfo';

export async function handler(rpInstance: RustPlusInstance, info: rp.AppInfo) {
    const fn = '[rustPlusInfoHandler: handler]';
    const logParam = {
        guildId: rpInstance.guildId,
        serverId: rpInstance.serverId
    };
    const rpInfo = rpInstance.rpInfo as RustPlusInfo;

    if (rpInfo.isNameChanged(info)) {
        log.info(`${fn} name changed, ` +
            `old: ${rpInfo?.appInfo.name}, ` +
            `new: ${info.name}`,
            logParam);
    }

    if (rpInfo.isHeaderImageChanged(info)) {
        log.info(`${fn} headerImage changed, ` +
            `old: ${rpInfo?.appInfo.headerImage}, ` +
            `new: ${info.headerImage}`,
            logParam);
    }

    if (rpInfo.isUrlChanged(info)) {
        log.info(`${fn} url changed, ` +
            `old: ${rpInfo?.appInfo.url}, ` +
            `new: ${info.url}`,
            logParam);
    }

    if (rpInfo.isMapChanged(info)) {
        log.info(`${fn} map changed, ` +
            `old: ${rpInfo?.appInfo.map}, ` +
            `new: ${info.map}`,
            logParam);
    }

    if (rpInfo.isMapSizeChanged(info)) {
        log.info(`${fn} mapSize changed, ` +
            `old: ${rpInfo?.appInfo.mapSize}, ` +
            `new: ${info.mapSize}`,
            logParam);
    }

    if (rpInfo.isWipeTimeChanged(info)) {
        log.info(`${fn} wipeTime changed, ` +
            `old: ${rpInfo?.appInfo.wipeTime}, ` +
            `new: ${info.wipeTime}`,
            logParam);
    }

    if (rpInfo.isPlayersChanged(info)) {
        //log.info(`${fn} players changed, ` +
        //    `old: ${rpInfo?.appInfo.players}, ` +
        //    `new: ${info.players}`,
        //    logParam);
    }

    if (rpInfo.isMaxPlayersChanged(info)) {
        log.info(`${fn} maxPlayers changed, ` +
            `old: ${rpInfo?.appInfo.maxPlayers}, ` +
            `new: ${info.maxPlayers}`,
            logParam);
    }

    if (rpInfo.isQueuedPlayersChanged(info)) {
        //log.info(`${fn} queuedPlayers changed, ` +
        //    `old: ${rpInfo?.appInfo.queuedPlayers}, ` +
        //    `new: ${info.queuedPlayers}`,
        //    logParam);
    }

    if (rpInfo.isSeedChanged(info)) {
        log.info(`${fn} seed changed, ` +
            `old: ${rpInfo?.appInfo.seed}, ` +
            `new: ${info.seed}`,
            logParam);
    }

    if (rpInfo.isSaltChanged(info)) {
        log.info(`${fn} salt changed, ` +
            `old: ${rpInfo?.appInfo.salt}, ` +
            `new: ${info.salt}`,
            logParam);
    }

    if (rpInfo.isLogoImageChanged(info)) {
        log.info(`${fn} logoImage changed, ` +
            `old: ${rpInfo?.appInfo.logoImage}, ` +
            `new: ${info.logoImage}`,
            logParam);
    }

    if (rpInfo.isNexusChanged(info)) {
        log.info(`${fn} nexus changed, ` +
            `old: ${rpInfo?.appInfo.nexus}, ` +
            `new: ${info.nexus}`,
            logParam);
    }

    if (rpInfo.isNexusIdChanged(info)) {
        log.info(`${fn} nexusId changed, ` +
            `old: ${rpInfo?.appInfo.nexusId}, ` +
            `new: ${info.nexusId}`,
            logParam);
    }

    if (rpInfo.isNexusZoneChanged(info)) {
        log.info(`${fn} nexusZone changed, ` +
            `old: ${rpInfo?.appInfo.nexusZone}, ` +
            `new: ${info.nexusZone}`,
            logParam);
    }

    if (rpInfo.isCamerasEnabledChanged(info)) {
        log.info(`${fn} camerasEnabled changed, ` +
            `old: ${rpInfo?.appInfo.camerasEnabled}, ` +
            `new: ${info.camerasEnabled}`,
            logParam);
    }

    /**
     * Custom handlers
     */

    if (rpInfo.isMaxPlayersIncreased(info)) {
        log.info(`${fn} Max players increased from ` +
            `${rpInfo?.appInfo.maxPlayers} to ` +
            `${info.maxPlayers}.`,
            logParam);
    }

    if (rpInfo.isMaxPlayersDecreased(info)) {
        log.info(`${fn} Max players decreased from ` +
            `${rpInfo?.appInfo.maxPlayers} to ` +
            `${info.maxPlayers}.`,
            logParam);
    }
}