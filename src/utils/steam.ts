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

import axios, { AxiosResponse } from 'axios';
import { XMLParser } from "fast-xml-parser";

import * as types from './types';
import { log } from '../../index';

export interface SteamInfo {
    steamId: types.SteamId;
    personaName: string;
    privateProfile: boolean;
    realName: string | null;
    location: string | null;
    imageUrl: string;
    summary: string | null;
    vacBan: boolean;
    memberSince: string | null;
}


async function fetchUrl(url: string): Promise<AxiosResponse> {
    const fn = `[fetchUrl: ${url}]`;

    try {
        const response = await axios.get(url, { timeout: 5000 });
        return response;
    }
    catch (error) {
        log.error(`${fn} Error fetching, Error: ${error}`);
        throw error;
    }
}

export async function fetchSteamProfile(steamId: types.SteamId): Promise<SteamInfo | null> {
    const fn = `[fetchSteamProfile]`;
    const logParam = { steamId: steamId };
    const url = `https://steamcommunity.com/profiles/${steamId}/?xml=1`;

    const response = await fetchUrl(url);
    if (response.status !== 200) {
        log.error(`${fn} Failed to fetch steam profile name. Status: ${response.status}`, logParam);
        return null;
    }

    const parser = new XMLParser({
        ignoreAttributes: false,
        trimValues: true,
    });

    const parsed = parser.parse(response.data);
    const profile = parsed?.profile;

    if (!profile) {
        log.error(`${fn} Invalid Steam profile XML response.`, logParam);
        return null;
    }

    let memberSince: string | null = profile.memberSince ?? null;
    if (memberSince !== null) {
        const date = new Date(memberSince);

        if (!isNaN(date.getTime())) {
            memberSince = Math.floor(date.getTime() / 1000).toString();
        }
    }

    return {
        steamId: profile.steamID64,
        personaName: profile.steamID,
        privateProfile: profile.privacyState !== 'public',
        realName: profile.realname ?? null,
        location: profile.location ?? null,
        imageUrl: profile.avatarFull,
        summary: profile.summary ?? null,
        vacBan: profile.vacBanned === 1 || profile.vacBanned === '1',
        memberSince: memberSince
    };
}