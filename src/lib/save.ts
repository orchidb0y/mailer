import { readFileSync, writeFileSync, createWriteStream } from 'node:fs';
import { __dirname} from '../api/filesystem.js';
import PDFDocument from 'pdfkit';
import Cryptr from 'cryptr';

export interface AppState {
  [key: string]: [(string | boolean), boolean] | string;
}

export interface AppConfig {
  [key: string]: string;
}

type AppInfo = AppState | AppConfig;

export type AppPaths = [string, string][];

/**
 * @description Takes the state of the app and returns it. It also decrypts any values that need to be decrypted.
 *
 * @example
 *
 * const state = await getState();
 * // Returns { 'logged' : [true, false], 'host': ['smtp.gmail.com', false], id: ['123456789', true], 'password': ['password', true]}
 *
 * @returns {Promise<AppState>} The state of the app
 */
export async function getState(): Promise<AppState> {
  const config: AppConfig = JSON.parse(readFileSync(__dirname + 'config\\config.json', { encoding: 'utf8' }));
  const cryptr = new Cryptr(config['SECRET_KEY']);

  let state: AppState = JSON.parse(readFileSync(__dirname + 'config\\state.json', { encoding: 'utf8' }));

  // decrypts encrypted values (state[key][0] is encrypted if state[key][1] is true)
  Object.keys(state).forEach(key => {
    if (state[key][1]) {
      state[key] = [cryptr.decrypt(state[key][0].toString()), true];
    }
  })

  return state;
}

/**
 * @description Saves the state of the app
 *
 * @remarks
 * This function takes the state of the app and saves it. It also encrypts any
 * values that need to be encrypted.
 *
 * @example
 * // Saves { 'logged' : [true, false], 'host': ['smtp.gmail.com', false], id: ['encrypted', true], 'password': ['encrypted', true]}
 * await saveState('logged': [true, false], 'host': ['smtp.gmail.com', false], id: ['123456789', true], 'password': ['password', true]])
 *
 * @example
 * // Saves { id: ['123456789', true]}
 * await saveState('id', '123456789', true);
 *
 * @param key The key of the state
 * @param value The value of the state
 * @param encrypt Whether or not to encrypt the value
 *
 * @returns {Promise<void>} - A promise that resolves when the state is saved
 */
export function saveState(key: string, value: string | boolean, encrypt = false): void {
  const config: AppConfig = JSON.parse(readFileSync(__dirname + 'config\\config.json', { encoding: 'utf8' }));
  const cryptr = new Cryptr(config['SECRET_KEY']);

  let finalValue: string;
  let state: AppState = JSON.parse(readFileSync(__dirname + 'config\\state.json', { encoding: 'utf8' }));

  if (encrypt && typeof value === 'string') {
    finalValue = cryptr.encrypt(value);
    state[key] = [finalValue, encrypt];
  } else {
    state[key] = [value, encrypt];
  }

  const stateString = JSON.stringify(state, null, 2);
  writeFileSync(__dirname + 'config\\state.json', stateString);
}

/**
 * @description Takes the config and paths of the app and returns them
 *
 * @returns {Promise<{config: AppConfig, paths: AppPaths}>} - The config and paths of the app
 *
 */
export function getConfigAndPath(): {config: AppConfig, paths: AppPaths} {
  const config: AppConfig = JSON.parse(readFileSync(__dirname + `config\\config.json`, { encoding: 'utf8' }));
  const paths: AppPaths = Object.entries(JSON.parse(readFileSync(__dirname + `config\\paths.json`, { encoding: 'utf8' })));

  return {config, paths}
}

/**
 * @description Saves the config and paths of the app
 *
 * @example
 *
 * // Saves { 'paths': { 'inbox': 'C:\\Users\\user\\Desktop\\inbox' } }
 * save('paths', 'inbox', 'C:\\Users\\user\\Desktop\\inbox');
 *
 * @param type - The type of config to save ('paths' or 'config')
 * @param key - The key of the config
 * @param value - The value of the config
 */
export function save(type: 'paths' | 'config', key: string, value: string): void {
  let info: AppInfo = JSON.parse(readFileSync(__dirname + `config\\${type}.json`, { encoding: 'utf8' }));

  info[key as keyof AppInfo] = value;

  const infoString: string = JSON.stringify(info, null, 2);
  writeFileSync(__dirname + `config\\${type}.json`, infoString);
}

interface SpamAnalysis {
  [rule: string]: string;
}

interface SpamResult {
  totalPoints: number;
  analysis: SpamAnalysis;
}

/**
 * @description Parses the spam analysis from the log.txt file that SpamAssassin generates
 *
 * @remarks
 * This function takes the output that SpamAssassin generates and parses it into a
 * SpamResult object. The SpamResult object contains the total points and a
 * SpamAnalysis object that contains the rule and description for each rule.
 * The SpamAnalysis object is a dictionary where the key is the rule and the
 * value is the description.
 *
 * @example
 *
 * // Returns { totalPoints: 5.1, analysis: { 'BAYES_50': 'BODY: Bayes spam probability is 50 to 60%'... } }
 * const spamResult = parseSpamAnalysis(emailText);
 *
 * @param {string} emailText - The log.txt file that SpamAssassin generates
 * @returns {SpamResult | null} - The result of the spam analysis
 */
export function parseSpamAnalysis(emailText: string): SpamResult | null {
  const startIndex: number = emailText.indexOf('Content analysis details:');

  const analysisText: string = emailText.substring(startIndex);
  const analysisLines: string[] = analysisText.split('\n').map(line => line.trim());

  const analysis: SpamAnalysis = {};
  let totalPoints: number = 0;

  for (const line of analysisLines) {
    const match: RegExpMatchArray | null = line.match(/^([\d.-]+)\s+(\w+)\s+(.*)/);
    if (match) {
      const [, pointsString, rule, description] = match;
      const points = parseFloat(pointsString);
      analysis[rule] = description;
      totalPoints += points;
    }
  }

  totalPoints = Number(totalPoints.toFixed(1));

  return {
    totalPoints,
    analysis,
  };
}

/**
 * @description Generates a PDF file from a SpamResult object
 *
 * @remarks
 * This function takes a SpamResult object and generates a PDF file using PDFKit.
 * It then saves the PDF file to the user's desktop.
 *
 * @example
 *
 * // Generates and saves a PDF file
 * generatePDF(spamResult);
 *
 * @param {SpamResult} spamResult - The result of the spam analysis
 */
export function generatePDF(spamResult: SpamResult): void {
  const doc = new PDFDocument();
  const filePath = __dirname + 'temp\\report.pdf';

  doc.fontSize(25).text('Spam Analysis', {
    underline: true,
  });

  doc.fontSize(15).text(`Total Points: ${spamResult.totalPoints}`);

  doc.fontSize(15).text('Analysis:', {
    underline: true,
  });

  Object.keys(spamResult.analysis).forEach((key) => {
    doc.fontSize(15).text(`${key}: ${spamResult.analysis[key]}`);
  });

  doc.pipe(createWriteStream(filePath));
  doc.end();
}