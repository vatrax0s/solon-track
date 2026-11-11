/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';

export interface SolonCourt {
  value: string;
  name: string;
}

export interface SolonQuery {
  courtOfficeOC: string;
  courtName?: string;
  searchType: 'GAK' | 'EAK';
  number: string;
  year: string;
}

export interface SolonPublication {
  id: string;
  decisionNumberYear: string; // Αριθμός Απόφασης / Έτος (c66)
  dispositiveType: string; // Τύπος Διατακτικού (c67)
  publicationDate: string; // Ημερομηνία Δημοσίευσης Απόφασης/Διάταξης (c68)
  judge: string; // Δικαστής - Ονοματεπώνυμο (c69)
  operativeSummary: string; // Δια Ταύτα - Ανωνυμοποιημένο (c71)
  result: string; // Αποτέλεσμα (c72)
  cleanDraftDate: string; // Ημερομηνία Προς Καθαρογραφή (cKathDateTo)
  judgeSignDate: string; // Ημερομηνία Θεώρησης Δικαστή (cJuSignedDate)
  presidentSignDate: string; // Ημερομηνία Θεώρησης Προέδρου (cPrSignedDate)
  secretarySignDate: string; // Ημερομηνία Θεώρησης Γραμματέα (cSeSignedDate)
  archiveDate: string; // Ημερομηνία Αρχείου (cArchiveDate)
}

export interface SolonCaseRecord {
  id: string;
  filingDate: string; // Ημ.Κατάθεσης (c2)
  gak: string; // Γενικός Aριθμός Kατάθεσης/Έτος (c3)
  eak: string; // Ειδικός Aριθμός Kατάθεσης/Έτος (c4)
  procedure: string; // Διαδικασία (c5)
  subject: string; // Αντικείμενο (c7)
  kind: string; // Είδος (c6)
  docket: string; // Αριθμός Πινακίου (c9)
  decision: string; // Αριθμός Aπόφασης/'Ετος - Είδος Διατακτικού (c10)
  hearingResult: string; // Αποτέλεσμα Συζήτησης (c11)
  decisionIssued: boolean;
  decisionStatus: 'positive' | 'negative' | 'neutral' | 'pending';
  publications?: SolonPublication[];
  publicationsChecked?: boolean;
}

export interface SolonQueryResult {
  success: boolean;
  courtName: string;
  query: SolonQuery;
  timestamp: string;
  count: number;
  records: SolonCaseRecord[];
  error?: string;
}

// Cookie jar for ADF state preservation
class CookieJar {
  private cookies = new Map<string, string>();

  setCookies(headers: Headers) {
    let list: string[] = [];
    if (typeof (headers as any).getSetCookie === 'function') {
      list = (headers as any).getSetCookie();
    } else {
      const c = headers.get('set-cookie');
      if (c) list = [c];
    }
    for (const str of list) {
      if (!str) continue;
      const part = str.split(';')[0].trim();
      const eqIdx = part.indexOf('=');
      if (eqIdx !== -1) {
        const name = part.slice(0, eqIdx).trim();
        const val = part.slice(eqIdx + 1).trim();
        this.cookies.set(name, val);
      }
    }
  }

  getCookieHeader(): string {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }
}

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .trim();
}

function classifyDecisionStatus(decisionText: string): { issued: boolean; status: 'positive' | 'negative' | 'neutral' | 'pending' } {
  const cleaned = (decisionText || '').replace(/&nbsp;/gi, '').trim();
  if (
    !cleaned ||
    cleaned === '' ||
    cleaned === '-' ||
    cleaned.includes('ΕΚΚΡΕΜΕΙ') ||
    cleaned.includes('Δεν έχει εκδοθεί')
  ) {
    return { issued: false, status: 'pending' };
  }

  const upper = cleaned.toUpperCase();
  
  if (upper.includes('ΔΕΚΤΗ') || upper.includes('ΚΑΤΑΔΙΚΗ') || upper.includes('ΕΓΚΡΙΝΕΤΑΙ')) {
    return { issued: true, status: 'positive' };
  }
  if (upper.includes('ΑΠΟΡΡΙΠΤ') || upper.includes('ΑΠΟΡΡΙΨΗ')) {
    return { issued: true, status: 'negative' };
  }
  if (upper.includes('ΕΝ ΜΕΡΕΙ') || upper.includes('ΜΕΡΙΚΩΣ')) {
    return { issued: true, status: 'positive' };
  }
  if (upper.includes('ΑΝΑΒΟΛ') || upper.includes('ΜΑΤΑΙΩ') || upper.includes('ΠΑΡΑΠΟΜΠΗ')) {
    return { issued: true, status: 'neutral' };
  }

  // If there's an alphanumeric decision number (e.g. 1966/2023 or 109339/2026)
  if (/\d+[\s\/-]+\d+/.test(cleaned) || upper.includes('ΑΠΟΦΑΣΗ') || upper.includes('ΕΚΔΟΘΗΚΕ')) {
    return { issued: true, status: 'neutral' };
  }

  return { issued: false, status: 'pending' };
}

export function parsePublicationsFromAdf(htmlOrXml: string): SolonPublication[] {
  const publications: SolonPublication[] = [];
  const clean = decodeHtmlEntities(htmlOrXml);

  // Look for rows in publishTable
  const rowMatches = [...clean.matchAll(/<tr[^>]*role="row"[^>]*_afrRK="(\d+)"[^>]*>(.*?)<\/tr>/gis)];
  for (const match of rowMatches) {
    const rowIdx = match[1];
    const rowHtml = match[2];

    const getVal = (colId: string): string => {
      const reg = new RegExp(`id="publishTable:\\d+:${colId}"[^>]*>(.*?)<\\/td>`, 'is');
      const m = rowHtml.match(reg);
      if (m) {
        const text = m[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, '').trim();
        return text && text !== '-' ? text : '';
      }
      return '';
    };

    const decNo = getVal('c66');
    const dispType = getVal('c67');
    const pubDate = getVal('c68');
    const judge = getVal('c69');
    const summary = getVal('c71');
    const res = getVal('c72');
    const cleanDate = getVal('cKathDateTo');
    const judgeSign = getVal('cJuSignedDate');
    const presSign = getVal('cPrSignedDate');
    const secSign = getVal('cSeSignedDate');
    const archDate = getVal('cArchiveDate');

    if (decNo || pubDate || judge || dispType || res || summary) {
      publications.push({
        id: `pub-${rowIdx}-${Date.now()}`,
        decisionNumberYear: decNo || '-',
        dispositiveType: dispType || '-',
        publicationDate: pubDate || '-',
        judge: judge || '-',
        operativeSummary: summary || '-',
        result: res || '-',
        cleanDraftDate: cleanDate || '-',
        judgeSignDate: judgeSign || '-',
        presidentSignDate: presSign || '-',
        secretarySignDate: secSign || '-',
        archiveDate: archDate || '-'
      });
    }
  }

  return publications;
}

export async function querySolonTrack(query: SolonQuery): Promise<SolonQueryResult> {
  const jar = new CookieJar();
  const baseUrl = 'https://extapps.solon.gov.gr/mojwp/faces/TrackLdoPublic';
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  const timeoutMs = 25000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // 1. Initial GET to obtain session and loopback javascript
    const res1 = await fetch(baseUrl, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'el,en-US;q=0.9,en;q=0.8'
      },
      signal: controller.signal
    });

    jar.setCookies(res1.headers);
    const html1 = await res1.text();

    const clean1 = html1.replace(/\r?\n/g, ' ');
    const match = clean1.match(/runLoopback\(\s*\d+,\s*['"]([^'"]+)['"],\s*['"]([^'"]+)['"],\s*['"]([^'"]+)['"],\s*['"]([^'"]+)['"],\s*['"]([^'"]*)['"],\s*['"]([^'"]*)['"],\s*['"]([^'"]+)['"],\s*['"]([^'"]+)['"]/);

    if (!match) {
      throw new Error('Η πύλη ΣΟΛΩΝ δεν επέστρεψε αρχική περίοδο λειτουργίας (ADF loopback token). Δοκιμάστε ξανά σε λίγο.');
    }

    const [, loopParam, loopVal, winModeParam, winIdParam, , , winIdVal, jsession] = match;

    // 2. Loopback GET to establish window and form viewstate
    const loopbackUrl = `https://extapps.solon.gov.gr/mojwp/faces/TrackLdoPublic${jsession}?${loopParam}=${loopVal}&${winModeParam}=0&${winIdParam}=${winIdVal}`;
    const res2 = await fetch(loopbackUrl, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'el,en-US;q=0.9,en;q=0.8',
        'Cookie': jar.getCookieHeader(),
        'Referer': baseUrl
      },
      signal: controller.signal
    });

    jar.setCookies(res2.headers);
    const html2 = await res2.text();

    const viewStateMatch = html2.match(/name="javax\.faces\.ViewState"\s+value="([^"]+)"/i);
    if (!viewStateMatch) {
      throw new Error('Δεν ήταν δυνατή η ανάκτηση του ViewState από τη φόρμα του ΣΟΛΩΝ.');
    }
    let viewState = viewStateMatch[1];

    // 3. Search POST
    const isEak = query.searchType === 'EAK';
    const formParams = new URLSearchParams();
    formParams.set('org.apache.myfaces.trinidad.faces.FORM', 'f1');
    formParams.set('javax.faces.ViewState', viewState);
    formParams.set('Adf-Window-Id', winIdVal);
    formParams.set('courtOfficeOC', query.courtOfficeOC);
    formParams.set('socSelectedSearchOption', isEak ? '1' : '0');

    if (isEak) {
      formParams.set('it1', '');
      formParams.set('it2', '');
      formParams.set('it1Eak', query.number.trim());
      formParams.set('it2eak', query.year.trim());
    } else {
      formParams.set('it1', query.number.trim());
      formParams.set('it2', query.year.trim());
      formParams.set('it1Eak', '');
      formParams.set('it2eak', '');
    }

    formParams.set('event', 'ldoSearch');
    formParams.set('event.ldoSearch', '<m xmlns="http://oracle.com/richClient/comm"><k v="type"><s>action</s></k></m>');
    formParams.set('oracle.adf.view.faces.RICH_UPDATE', '');

    const postUrl = `https://extapps.solon.gov.gr/mojwp/faces/TrackLdoPublic${jsession}`;
    const res3 = await fetch(postUrl, {
      method: 'POST',
      headers: {
        'User-Agent': userAgent,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Adf-Rich-Message': 'true',
        'Adf-Window-Id': winIdVal,
        'Cookie': jar.getCookieHeader(),
        'Referer': loopbackUrl
      },
      body: formParams.toString(),
      signal: controller.signal
    });

    jar.setCookies(res3.headers);
    const text3 = await res3.text();

    const updatedVsMatch = text3.match(/<update id="javax\.faces\.ViewState"><!\[CDATA\[(.*?)\]\]><\/update>/);
    if (updatedVsMatch) {
      viewState = updatedVsMatch[1];
    }

    const pageStateMatch = text3.match(/sendStreamingRequest\(["'](\d+)["']/);
    const pageStateId = pageStateMatch ? pageStateMatch[1] : '1';

    // 4. Streaming GET to retrieve table rows
    const streamQuery = new URLSearchParams();
    streamQuery.set('Adf-Rich-Message', 'true');
    streamQuery.set('unique', Date.now().toString());
    streamQuery.set('oracle.adf.view.rich.STREAM', 'pc1:ldoTable');
    streamQuery.set('Adf-Page-Id', pageStateId);
    streamQuery.set('javax.faces.ViewState', viewState);
    streamQuery.set('Adf-Window-Id', winIdVal);

    const streamUrl = `https://extapps.solon.gov.gr/mojwp/faces/TrackLdoPublic?${streamQuery.toString()}`;
    const res4 = await fetch(streamUrl, {
      headers: {
        'User-Agent': userAgent,
        'Cookie': jar.getCookieHeader(),
        'Referer': loopbackUrl
      },
      signal: controller.signal
    });

    jar.setCookies(res4.headers);
    const text4 = await res4.text();

    // 5. Parse Table Data
    const records: SolonCaseRecord[] = [];
    const cdataMatch = text4.match(/<update id="pc1:ldoTable"><!\[CDATA\[(.*?)\]\]><\/update>/s);
    
    if (cdataMatch) {
      const tableData = cdataMatch[1];
      const rows = [...tableData.matchAll(/<tr[^>]*_afrRK="(\d+)"[^>]*>(.*?)<\/tr>/gis)];

      for (let i = 0; i < rows.length; i++) {
        const rowMatch = rows[i];
        const rowId = rowMatch[1];
        const rowHtml = rowMatch[2];

        const getCol = (colName: string): string => {
          const reg = new RegExp(`<(?:span|td)[^>]*id="pc1:ldoTable:\\d+:${colName}[^"]*"[^>]*>(.*?)<\\/(?:span|td)>`, 'is');
          const m = rowHtml.match(reg);
          if (m) {
            const raw = m[1].replace(/<[^>]+>/g, '').trim();
            return decodeHtmlEntities(raw);
          }
          return '';
        };

        const cleanValue = (val: string): string => {
          if (!val) return '';
          const c = val.replace(/&nbsp;/gi, '').trim();
          return c === '-' ? '' : c;
        };

        const filingDate = cleanValue(getCol('c2'));
        const gak = cleanValue(getCol('c3'));
        const eak = cleanValue(getCol('c4'));
        const procedure = cleanValue(getCol('c5'));
        const subject = cleanValue(getCol('c7'));
        const kind = cleanValue(getCol('c6'));
        const docket = cleanValue(getCol('c9'));
        const rawDecision = cleanValue(getCol('c10'));
        const hearingResult = cleanValue(getCol('c11'));

        const decision = rawDecision ? rawDecision : 'Δεν έχει εκδοθεί απόφαση (Εκκρεμεί)';
        const { issued, status } = classifyDecisionStatus(decision);

        records.push({
          id: `case-${rowId}-${Date.now()}`,
          filingDate: filingDate || '-',
          gak: gak || '-',
          eak: eak || '-',
          procedure: procedure || '-',
          subject: subject || '-',
          kind: kind || '-',
          docket: docket || '-',
          decision,
          hearingResult: hearingResult || '-',
          decisionIssued: issued,
          decisionStatus: status
        });
      }
    }

    // 6. Fetch "Λεπτομέρειες" -> "Δημοσιεύσεις" (Publications) for record if available
    if (records.length > 0) {
      try {
        const detailParams = new URLSearchParams();
        detailParams.set('org.apache.myfaces.trinidad.faces.FORM', 'f1');
        detailParams.set('javax.faces.ViewState', viewState);
        detailParams.set('Adf-Window-Id', winIdVal);
        detailParams.set('courtOfficeOC', query.courtOfficeOC);
        detailParams.set('socSelectedSearchOption', isEak ? '1' : '0');
        if (isEak) {
          detailParams.set('it1Eak', query.number.trim());
          detailParams.set('it2eak', query.year.trim());
        } else {
          detailParams.set('it1', query.number.trim());
          detailParams.set('it2', query.year.trim());
        }
        detailParams.set('event', 'pc1:ldoDetails');
        detailParams.set('event.pc1:ldoDetails', '<m xmlns="http://oracle.com/richClient/comm"><k v="type"><s>action</s></k></m>');
        detailParams.set('oracle.adf.view.rich.DELTAS', '{pc1:ldoTable={selectedRowKeys=0}}');
        detailParams.set('oracle.adf.view.faces.RICH_UPDATE', '');

        const resDetails = await fetch(postUrl, {
          method: 'POST',
          headers: {
            'User-Agent': userAgent,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Adf-Rich-Message': 'true',
            'Adf-Window-Id': winIdVal,
            'Cookie': jar.getCookieHeader(),
            'Referer': loopbackUrl
          },
          body: detailParams.toString(),
          signal: controller.signal
        });

        jar.setCookies(resDetails.headers);
        const detailText = await resDetails.text();
        const redirectMatch = detailText.match(/<redirect url="([^"]+)"/);

        if (redirectMatch) {
          const redirectPath = redirectMatch[1].replace(/&amp;/g, '&');
          const targetUrl = `https://extapps.solon.gov.gr${redirectPath}`;
          const resRedirect = await fetch(targetUrl, {
            headers: {
              'User-Agent': userAgent,
              'Cookie': jar.getCookieHeader(),
              'Referer': postUrl
            },
            signal: controller.signal
          });
          jar.setCookies(resRedirect.headers);
          const redirectHtml = await resRedirect.text();

          const vsDetailsMatch = redirectHtml.match(/name="javax\.faces\.ViewState"\s+value="([^"]+)"/i);
          const detailsViewState = vsDetailsMatch ? vsDetailsMatch[1] : viewState;
          const formActionMatch = redirectHtml.match(/<form[^>]*action="([^"]+)"/i);
          const detailsFormAction = formActionMatch ? formActionMatch[1] : '/mojwp/faces/LdoPublicDetails';

          // Disclose tab9 (Δημοσιεύσεις)
          const tabParams = new URLSearchParams();
          tabParams.set('org.apache.myfaces.trinidad.faces.FORM', 'f1');
          tabParams.set('javax.faces.ViewState', detailsViewState);
          tabParams.set('Adf-Window-Id', winIdVal);
          tabParams.set('event', 'tab9');
          tabParams.set('event.tab9', '<m xmlns="http://oracle.com/richClient/comm"><k v="type"><s>disclosure</s></k><k v="expand"><b>true</b></k></m>');
          tabParams.set('oracle.adf.view.rich.DELTAS', '{tab4={disclosed=false},tab9={disclosed=true}}');
          tabParams.set('oracle.adf.view.faces.RICH_UPDATE', '');

          const tabPostUrl = `https://extapps.solon.gov.gr${detailsFormAction}`;
          const resTab = await fetch(tabPostUrl, {
            method: 'POST',
            headers: {
              'User-Agent': userAgent,
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              'Adf-Rich-Message': 'true',
              'Adf-Window-Id': winIdVal,
              'Cookie': jar.getCookieHeader(),
              'Referer': targetUrl
            },
            body: tabParams.toString(),
            signal: controller.signal
          });
          jar.setCookies(resTab.headers);
          const tabText = await resTab.text();
          const publications = parsePublicationsFromAdf(tabText);
          if (records[0]) {
            records[0].publications = publications;
            records[0].publicationsChecked = true;
          }
        }
      } catch (detailsErr) {
        console.warn('Could not auto-fetch publications details from Solon:', detailsErr);
        if (records[0]) {
          records[0].publications = [];
          records[0].publicationsChecked = true;
        }
      }
    }

    return {
      success: true,
      courtName: query.courtName || query.courtOfficeOC,
      query,
      timestamp: new Date().toISOString(),
      count: records.length,
      records
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    let msg = err.message || 'Σφάλμα σύνδεσης με το σύστημα ΣΟΛΩΝ.';
    if (err.name === 'AbortError') {
      msg = 'Η σύνδεση με το portal ΣΟΛΩΝ έληξε λόγω καθυστέρησης του εξυπηρετητή (Timeout). Παρακαλώ δοκιμάστε ξανά.';
    }
    return {
      success: false,
      courtName: query.courtName || query.courtOfficeOC,
      query,
      timestamp: new Date().toISOString(),
      count: 0,
      records: [],
      error: msg
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
