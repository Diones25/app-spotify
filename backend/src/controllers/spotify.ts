import { Request, Response } from "express";
import axios from 'axios';
const querystring = require("querystring");
import dotenv from 'dotenv';
dotenv.config();

const stateKey = "spotify_auth_state";
const redirect_uri = process.env.REDIRECT_URI;
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;

const generateRandomString = function (length: number) {
  let text = "";
  let possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

const login = async (req: Request, res: Response) => {
  const state = generateRandomString(16);
  res.cookie(stateKey, state);

  const scope = "ugc-image-upload user-read-playback-state user-modify-playback-state user-read-currently-playing app-remote-control streaming playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public user-follow-modify user-follow-read user-read-playback-position user-top-read user-read-recently-played user-library-modify user-library-read user-read-email user-read-private user-soa-link user-soa-unlink soa-manage-entitlements soa-manage-partner soa-create-partner";
  res.redirect(
    "https://accounts.spotify.com/authorize?" +
    querystring.stringify({
      response_type: "code",
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state,
    })
  );
}

const callback = async (req: Request, res: Response) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect(
      "/#" +
      querystring.stringify({
        error: "state_mismatch",
      })
    );
  } else {
    res.clearCookie(stateKey);

    try {
      // Configurações para a requisição de tokens
      const authOptions = {
        method: 'POST',
        url: 'https://accounts.spotify.com/api/token',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${client_id}:${client_secret}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: querystring.stringify({
          code: code,
          redirect_uri: redirect_uri,
          grant_type: 'authorization_code',
        }),
      };

      // Fazendo a requisição para obter o access token e refresh token
      const tokenResponse = await axios(authOptions);
      const access_token = tokenResponse.data.access_token;
      const refresh_token = tokenResponse.data.refresh_token;

      // Configurações para a requisição ao Spotify API
      const userOptions = {
        method: 'GET',
        url: 'https://api.spotify.com/v1/me',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      };

      // Usando o access token para acessar a API do Spotify
      const userResponse = await axios(userOptions);

      // Redireciona com os tokens obtidos
      res.redirect(
        `${process.env.REDIRECT_FRONT_END}` +
        querystring.stringify({
          token: access_token,
          refresh_token: refresh_token,
        })
      );
    } catch (error) {
      console.error(error);
      res.redirect(
        "/#" +
        querystring.stringify({
          error: "invalid_token",
        })
      );
    }
  }


}

const refreshToken = async (req: Request, res: Response) => {
  try {
    // Obtendo o refresh token da query
    const refresh_token = req.query.refresh_token as string;

    // Configurações para a requisição de atualização do token
    const authOptions = {
      method: 'POST',
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${client_id}:${client_secret}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh_token,
      }),
    };

    // Fazendo a requisição para obter um novo access token
    const response = await axios(authOptions);
    const access_token = response.data.access_token;

    // Enviando o novo access token como resposta
    res.send({
      access_token: access_token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to refresh token' });
  }
}

export default {
  login,
  callback,
  refreshToken
}