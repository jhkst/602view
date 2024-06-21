const Charset = {
    KEYBCS2: 0,
    LATIN2: 1,
    KOI8CS: 2
};

const CharsetMode = {
    LATIN: 0,
    CYRILLIC: 1 // cyrillic mode (when t602 executed with /r switch)
}

const CharsetTable = {  
    [CharsetMode.LATIN]: {                               
        [Charset.KEYBCS2]: "⌂ČüéďäĎŤčěĚĹÍľĺÄÁÉžŽôöÓůÚýÖÜŠĽÝŘťáíóúňŇŮÔšřŕŔ¼§«»ÇÇù│┤ß£ÆØÅæøå  ┐└┴┬├─┼¤òì₧¡Ñ¿ñèˇ½       à┘┌█▄´°▀αβΓπ∑σµτΦΘΩδ∞øε∩≡±≥≤⌠⌡÷≈ºÀˆ√˝²  ",
        [Charset.LATIN2] : "⌂Çüéùäůè£ÆØÅæøÄÄåÉĹĺôöĽľ òÖÜŤťì₧čáíóú¡ÑŽž¿ñ∑σČ‒«»τ  │┤Á Ě    ≡±≥┐└┴┬├─┼≤⌠⌡≈º√²½¼¤αβĎΓďŇÍπě┘┌█▄µŮ▀ÓßÔΦΘňŠšŔÚŕΩýÝδ∞ø˝εˇ∩§÷à´°ÀˆŘř  ",
        [Charset.KOI8CS] : "⌂Çùè§ß£ÆØÅæøå ¤¤òì₧¡Ñ¿ñ█▄▀       ≡±≥≤⌠⌡÷≈º√²½¼‒«»αβΓπ∑σµτΦΘΩδ∞øε∩┌á└čďěŕ─üíůĺľöňóôäřšťú├éàýž┬ˇ´°┼┐Á┘ČĎĚŔ│ÜÍŮĹĽÖŇÓÔÄŘŠŤÚ┤ÉÀÝŽ┴˝ˆ  ",
    },
    [CharsetMode.CYRILLIC]: {
        [Charset.KEYBCS2]: "⌂ČüéďäĎŤčěĚĹÍľĺÄÁÉžŽôöÓůÚýÖÜŠĽÝŘťáíóúňŇŮÔšřŕŔк§лмББВ│┤ßДЁЖЗИЙК  ┐└┴┬├─┼ЛМНПРТУФГˇйЦЧШЩЪЫЬà┘┌█▄´°▀нпртуфцчшщъыьэюяЭЮЯбвгдёжÀˆз˝и  ",
        [Charset.LATIN2]:  "⌂БüéВäůГДЁЖЗИЙÄÄКÉĹĺôöĽľ МÖÜŤťНПčáíóúРТŽžУФуфČ‒лмчЦЧ│┤ÁШĚЩЪЫЬЭЮЯ┐└┴┬├─┼бвгёжзийкЛнпĎрďŇÍтě┘┌█▄цŮ▀ÓßÔшщňŠšŔÚŕъýÝыьэ˝юˇя§дà´°ÀˆŘř  ",
        [Charset.KOI8CS]:  "⌂БВГ§ßДЁЖЗИЙК ЛЛМНПРТУФ█▄▀ЦЧШЩЪЫЬЭЮЯбвгдёжзийк‒лмнпртуфцчшщъыьзюя┌á└čďěŕ─üíůĺľöňóôäřšťú├éàýž┬ˇ´°┼┐Á┘ČĎĚŔ│ÜÍŮĹĽÖŇÓÔÄŘŠŤÚ┤ÉÀÝŽ┴˝ˆ  ",
    }
}

const LineHeight = {
    SINGLE: 6,
    ONE_HALF: 4,
    DOUBLE: 3
}

const FontStyle = {
    BOLD:        0x02,
    ITALIC:      0x04,
    UNDERLINE:   0x13,
    WIDE:        0x0f,
    HIGH:        0x10,
    UPPER_INDEX: 0x14,
    LOWER_INDEX: 0x16,
    BIG:         0x1d
}

// Description: 602Reader class to read and render 602 files
class T602Reader {

    constructor(arrayBuffer) {
        this.lineFileReader = new LineFileReader(arrayBuffer);
        this.charsetMode = CharsetMode.LATIN;
        this.charsetTable = Charset.KEYBCS2;
    }

    render(documentWriter) {
        this.lineFileReader.onNextLine(line => this.#processLine(line, documentWriter));
    }

    setCharsetMode(charsetMode) {
        this.charsetMode = charsetMode;
    }

    #setCharsetTable(charsetTable) {
        this.charsetTable = charsetTable;
    }

    #processLine(line, documentWriter) {
        if (line.length === 0) {
            this.#processText(line, documentWriter);
            return;
        }

        const fullCmd = line.map(c => String.fromCharCode(c)).join('');
        const isAtCmd = fullCmd.startsWith('@');
        const isDotCmd = fullCmd.startsWith('.');

        if (isAtCmd || isDotCmd) {
            let cmd, param;
            if (isAtCmd) {
                cmd = fullCmd.substring(1, 3);
                param = fullCmd.length > 3 ? fullCmd.substring(4) : null;
            } else {
                cmd = /^\.(\w+)/.exec(fullCmd)[1];
                param = fullCmd.substring(cmd.length + 1);
            }

            try {
                if (isAtCmd) {
                    this.#processCmd(cmd, param, documentWriter);
                } else {
                    this.#processDotCmd(cmd, param, documentWriter);
                }
            } catch (e) {
                console.warn(e.message);
                this.#processText(line, documentWriter);
            }
        } else {
            this.#processText(line, documentWriter);
        }
    }

    #processCmd(cmd, param, documentWriter) {
        switch (cmd) {
            case 'MT': documentWriter.setMarginTop(parseInt(param)); break;
            case 'MB': documentWriter.setMarginBottom(parseInt(param)); break;
            case 'TB': documentWriter.setTabs(param); break;
            case 'CT': 
                documentWriter.setCharTable(parseInt(param)); 
                this.#setCharsetTable(parseInt(param)); 
                break;
            case 'PN': documentWriter.setFirstPageNumber(parseInt(param)); break;
            case 'LH': documentWriter.setLineHeight(parseInt(param)); break;
            case 'LM': documentWriter.setLeftMargin(parseInt(param)); break;
            case 'RM': documentWriter.setRightMargin(parseInt(param)); break;
            case 'PL': documentWriter.setPageLength(parseInt(param)); break;
            case 'PO': documentWriter.setPrintLeftMargin(parseInt(param)); break;
            case 'OP': documentWriter.setPrintOmitPageNumber(); break;
            case 'HE': documentWriter.setHeader(param); break;
            case 'FO': documentWriter.setFooter(param); break;
    
            // examples: not sure what they do
            // @ST ,1,20,1,2,0,0,1,1,0,0,5,11,17,23,29,35,41,47,53,59,65,71,77,83,89,95,101,107,113,119,125,131,137,143,149,155,161,167,173,179,185,191,197,203,209
            // @ST ,1,65,1,2,2,0,1,1,0,0,6,12,18,24,30,36,42,48,54,60,66,72,78,84,90,96,102,108,114,120,126,132,138,144,150,156,162,168,174,180,186,192,198,204,210
            // @ST ,1,67,1,2,0,0,1,1,0,0,5,11,17,23,29,35,41,47,53,59,65,71,77,83,89,95,101,107,113,119,125,131,137,143,149,155,161,167,173,179,185,191,197,203,209
            // @ST ,1,78,1,2,0,0,1,1,0,0,5,11,17,23,29,35,41,47,53,59,65,71,77,83,89,95,101,107,113,119,125,131,137,143,149,155,161,167,173,179,185,191,197,203,209
            // @ST STANDARD,1,65,1,2,0,0,1,1,0,0,6,12,18,24,30,36,42,48,54,60,66,72,78,84,90,96,102,108,114,120,126,132,138,144,150,156,162,168,174,180,186,192,198,204,210            
            case 'ST': this.#cmdIgnore(cmd, param); break; //?
    
            case 'PA': documentWriter.newPage(); break;  //?
            case 'PG': this.#cmdIgnore(cmd, param); break; //Page Break?
            case 'PC': this.#cmdIgnore(cmd, param); break; //Page Count?
            case 'HM': this.#cmdIgnore(cmd, param); break;
            case 'FM': this.#cmdIgnore(cmd, param); break;
            case 'CP': this.#cmdIgnore(cmd, param); break; // @CP 5 // forbid page break (for next line) @CP 7 sometimes too
            case 'KP': this.#cmdIgnore(cmd, param); break; //?
            case 'IX': this.#cmdIgnore(cmd, param); break; //?
            case 'PI': this.#cmdPicture(param.split(',')); break;
            case 'DF': this.#cmdIgnore(cmd, param); break;
            case 'NT': this.#cmdIgnore(cmd, param); break;
            case 'SV': this.#cmdIgnore(cmd, param); break;
            case 'DV': this.#cmdIgnore(cmd, param); break;
            case 'RP': this.#cmdIgnore(cmd, param); break; //?!
            default: 
                throw new Error('Unknown command ' + cmd + ' with param ' + param);
        }
    }

    #processDotCmd(cmd, param, documentWriter) {
        cmd = cmd.toUpperCase();
        switch (cmd) {
            case 'KAP': this.#cmdIgnore(cmd, param); break; // Chapter title
            case 'ENDTEXT': this.#cmdIgnore(cmd, param); break; // End of text
            case 'PA': documentWriter.newPage(); break; // Page break
            case 'STOP': this.#cmdIgnore(cmd, param); break; // End of document
            case 'PI': this.#cmdPicture(param.split(',')); break; // Picture
            case 'PROC': this.#cmdIgnore(cmd, param); break; // Procedure
            case 'FOR': this.#cmdIgnore(cmd, param); break; // For loop
            case 'ENDFOR': this.#cmdIgnore(cmd, param); break; // End of for loop
            default:
                throw new Error('Unknown dot command ' + cmd + ' with param ' + param);
        }
    }

    #cmdIgnore(cmd, param) {
        console.warn('Ignoring command', cmd, 'with param', param);
    }

    #cmdPicture(params) {
        console.info('Picture', params);
        let file = params[0];
        let height = params[1];
        let width = params[2];
        let inverse = params.slice(3).includes('i');
        let rotation = params.slice(3).find(p => !isNaN(p)) || 0;

        console.info('Picture', file, height, width, rotation, inverse);
    }

    #charToUtf8(ch, charsetMode = CharsetMode.LATIN, charsetTable = Charset.KEYBCS2) {
        if (ch < 32) {
            return ' ';
        } else if (ch < 127) {
            return String.fromCharCode(ch);
        } else {
            return CharsetTable[charsetMode][charsetTable][ch - 127];
        }
    }

    #processText(line, documentWriter) {
        documentWriter.newLine();
        for (let i = 0; i < line.length; i++) {
            if (line[i] < 32 || line[i] === 0x8d || line[i] === 0xfe || line[i] === 0xad) {
                this.#processControlChar(line[i], documentWriter);
            } else {
                this.#writeChar(documentWriter, line[i]);
            }
        }
    }

    #writeChar(documentWriter, ch) {
        documentWriter.writeChar(this.#charToUtf8(ch, this.charsetMode, this.charsetTable));
    }

    #processControlChar(ch, documentWriter) {
        switch (ch) {
            case FontStyle.BOLD:
            case FontStyle.ITALIC:
            case FontStyle.WIDE:
            case FontStyle.HIGH:
            case FontStyle.UNDERLINE:
            case FontStyle.UPPER_INDEX:
            case FontStyle.LOWER_INDEX:
            case FontStyle.BIG:
                documentWriter.switchFontStyle(ch);
    
            case 0x01: console.debug('Elite'); break;
            case 0x03: console.debug('Condensed'); break;
            case 0x09: documentWriter.writeTab(); break;
            case 0x11: console.debug('User1'); break;
            case 0x12: console.debug('User2'); break;
            case 0x15: console.debug('User3'); break;
            case 0x17: console.debug('User4'); break;
            case 0x18: console.debug('User5'); break;
            case 0x19: console.debug('User6'); break;
            case 0x1a: console.debug('1A', ch); break;
            case 0x8d: console.debug('8D', ch); break;
            case 0xad: console.debug('AD', ch); break;
            case 0xfe: this.#writeChar(documentWriter, 0x20); break; // non-breaking space
            default: 
                console.warn('Unknown control char', ch);
        }
    }
}

// Description: LineFileReader class to read 602 files line by line
class LineFileReader {
    constructor(arrayBuffer) {
        this.dataView = new DataView(arrayBuffer);
        this.dataViewPos = 0;
    }

    readChar() {
        try {
            return this.dataView.getUint8(this.dataViewPos++);
        } catch (e) {
            return 0;
        }
    }

    readLine() {
        let line = [];
        let prevCh = 0;
        let ch = this.readChar();
        while (ch !== 10 && ch !== 0) {
            line.push(ch);
            prevCh = ch;
            ch = this.readChar();
        }
        if (prevCh === 13) {
            line.pop();
        }

        return line;
    }

    onNextLine(callback) {
        while (this.dataViewPos < this.dataView.byteLength) {
            callback(this.readLine());
        }
    }
    
}