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
import { RustPlusTime } from '../structures/rustPlusTime';

export async function handler(rpInstance: RustPlusInstance, time: rp.AppTime) {
    const fn = '[rustPlusTimeHandler: handler]';
    const logParam = {
        guildId: rpInstance.guildId,
        serverId: rpInstance.serverId
    };
    const rpTime = rpInstance.rpTime as RustPlusTime;

    if (rpTime.isDayLengthMinutesChanged(time)) {
        log.info(`${fn} dayLengthMinutes changed, ` +
            `old: ${rpTime?.appTime.dayLengthMinutes}, ` +
            `new: ${time.dayLengthMinutes}`,
            logParam);
    }

    if (rpTime.isTimeScaleChanged(time)) {
        log.info(`${fn} timeScale changed, ` +
            `old: ${rpTime?.appTime.timeScale}, ` +
            `new: ${time.timeScale}`,
            logParam);
    }

    if (rpTime.isSunriseChanged(time)) {
        log.info(`${fn} sunrise changed, ` +
            `old: ${rpTime?.appTime.sunrise}, ` +
            `new: ${time.sunrise}`,
            logParam);
    }

    if (rpTime.isSunsetChanged(time)) {
        log.info(`${fn} sunset changed, ` +
            `old: ${rpTime?.appTime.sunset}, ` +
            `new: ${time.sunset}`,
            logParam);
    }

    if (rpTime.isTimeChanged(time)) {
        //log.info(`${fn} time changed, ` +
        //    `old: ${rpTime?.appTime.time}, ` +
        //    `new: ${time.time}`,
        //    logParam);
    }

    /**
     * Custom handlers
     */

    if (rpTime.isTurnedDay(time)) {
        log.info(`${fn} Just turned day.`, logParam);
    }

    if (rpTime.isTurnedNight(time)) {
        log.info(`${fn} Just turned night.`, logParam);
    }
}