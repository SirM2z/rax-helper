import { CompletionItemProvider, TextDocument, Position, CancellationToken, ProviderResult, CompletionItem, CompletionList, CompletionItemKind, Range, SnippetString } from "vscode";
import * as TAGS from '../config/rax-tags.json';
import * as ATTRS from '../config/rax-attrs.json';

export interface TagObject {
  text: string;
  offset: number;
}

export default class RaxCompletionItemProvider implements CompletionItemProvider {
  private _document!: TextDocument;
  private _position!: Position;
  private tagReg: RegExp = /<(\w+)\s*/g;
  private attrReg: RegExp = /(?:\(|\s*)(\w+)=['"][^'"]*/;
  private tagStartReg:  RegExp = /<(\w*)$/;

  provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<CompletionItem[] | CompletionList> {
    this._document = document;
    this._position = position;

    const tag: TagObject | undefined = this.getPreTag();
    const attr = this.getPreAttr();
    if (this.isAttrValueStart(tag, attr)) {
      return this.getAttrValueSuggestion(tag.text, attr);
    } else if(this.isAttrStart(tag)) {
      return this.getAttrSuggestion(tag.text);
    } else if (this.isTagStart()) {
      return this.getTagSuggestion();
    } else {return [];}
  }

  // get current line content
  getTextBeforePosition(): string {
    var start = new Position(this._position.line, 0);
    var range = new Range(start, this._position);
    return this._document.getText(range);
  }

  // #region get tag name
  getPreTag(): TagObject | undefined {
    let line = this._position.line;
    let tag: TagObject | string | undefined;
    let txt = this.getTextBeforePosition();
  
    while (this._position.line - line < 10 && line >= 0) {
      if (line !== this._position.line) {
        txt = this._document.lineAt(line).text;
      }
      tag = this.matchTag(this.tagReg, txt, line);
      if (tag === 'break') {
        return;
      }
      if (tag) {
        return <TagObject>tag;
      }
      line--;
    }
    return;
  }

  matchTag(reg: RegExp, txt: string, line: number): TagObject | string | undefined {
    let match: RegExpExecArray | null;
    let arr: TagObject[] = [];
 
    if (/<\/?\w+[^<>]*>[\s\w]*<?\s*\w*$/.test(txt) || (this._position.line === line && (/^\s*[^<]+\s*>[^<\/>]*$/.test(txt) || /[^<>]*<$/.test(txt[txt.length - 1])))) {
      return 'break';
    }
    while((match = reg.exec(txt))) {
      arr.push({
        text: match[1],
        offset: this._document.offsetAt(new Position(line, match.index))
      });
    }
    return arr.pop();
  }
  // #endregion get tag name end

  // #region get attr name
  getPreAttr(): string {
    let txt = this.getTextBeforePosition().replace(/"[^'"]*(\s*)[^'"]*$/, '');
    let end = this._position.character;
    let start = txt.lastIndexOf(' ', end) + 1;
    let parsedTxt = this._document.getText(new Range(this._position.line, start, this._position.line, end));

    return this.matchAttr(this.attrReg, parsedTxt);
  }

  matchAttr(reg: RegExp, txt: string): string {
    let match: RegExpExecArray | null;
    match = reg.exec(txt);
    return !/"[^"]*"/.test(txt) && match && match[1];
  }
  // #endregion get attr name end

  // #region attribute value intelliSense
  isAttrValueStart(tag: Object | string | undefined, attr: string) {
    return tag && attr;
  }

  getAttrValueSuggestion(tag: string, attr: string): CompletionItem[] {
    let suggestions:CompletionItem[] = [];
    const options = this.getAttrValues(tag, attr);
    options.forEach((opt: any) => {
      suggestions.push({
        label: opt.val,
        kind: CompletionItemKind.Value,
        documentation: opt.des || ''
      });
    });
    return suggestions;
  }

  getAttrValues(tag: string | undefined, attr: string) {
    let attrItem = this.getAttrItem(tag, attr);
    let options = attrItem && attrItem.options;
    if (!options && attrItem) {
      if (attrItem.type === 'boolean') {
        options = [{val: 'true'}, {val: 'false'}];
      } else if (attrItem.type === 'icon') {
        options = ATTRS['icons'];
      } else if (attrItem.type === 'shortcut-icon') {
        options = [];
        ATTRS['icons'].forEach((icon: { replace: (arg0: RegExp, arg1: string) => void; }) => {
          options.push(icon.replace(/^el-icon-/, ''));
        });
      }
    }
    return options || [];
  }

  getAttrItem(tag: string | undefined, attr: string) {
    return ATTRS[`${tag}/${attr}`] || ATTRS[attr];
  }
  // #endregion attribute value intelliSense end

  // #region attributes intelliSense
  isAttrStart(tag: TagObject | undefined) {
    if (tag && TAGS[tag.text]) {
      return tag;
    }
    return;
  }

  getAttrSuggestion(tag: string) {
    let suggestions = [];
    let tagAttrs = this.getTagAttrs(tag);

    tagAttrs.forEach(attr => {
      const attrItem = this.getAttrItem(tag, attr);
      if (attrItem) {
          const sug = this.buildAttrSuggestion({attr, tag}, attrItem);
          if (sug) {
            suggestions.push(sug);
          }
      }
    });
    for (let attr in ATTRS) {
      const attrItem = this.getAttrItem(tag, attr);
      if (attrItem && attrItem.global) {
        const sug = this.buildAttrSuggestion({attr, tag: null}, attrItem);
        if (sug) {
          suggestions.push(sug);
        }
      }
    }
    return suggestions;
  }

  getTagAttrs(tag: string) {
    return (TAGS[tag] && TAGS[tag].attributes) || [];
  }

  buildAttrSuggestion({attr, tag}, {description, type, version}) {
    const options = this.getAttrValues(tag, attr);
    const hasBrace = (type === 'method' || type === 'object' || type === 'boolean') ? true : false;
    let insertText: SnippetString;
    if (type === 'flag') {
      insertText = new SnippetString(`${attr}`);
    } else {
      let attrValStr = options.length === 0 ? `$1` : `\${1|${options.map(item => item.val).join(',')}|}`;
      if (hasBrace) {
        attrValStr = '{' + attrValStr + '}';
      } else {
        attrValStr = '"' + attrValStr + '"';
      }
      insertText = new SnippetString(`${attr}=${attrValStr}`);
    }
    return {
      label: attr,
      insertText,
      kind: (type && (type === 'method')) ? CompletionItemKind.Method : CompletionItemKind.Property,
      detail:  tag ?  `<${tag}> ${version ? `(version: ${version})`: ''}` : `Rax.js ${version ? `(version: ${version})`: ''}`,
      documentation: description
    };
  }
  // #endregion attributes intelliSense end

  // #region tags intelliSense
  isTagStart() {
    let txt = this.getTextBeforePosition();
    return this.tagStartReg.test(txt);
  }

  getTagSuggestion() {
    let suggestions = [];
    let id = 100;
    for (let tag in TAGS) {
      suggestions.push(this.buildTagSuggestion(tag, TAGS[tag], id));
      id++;
    }
    return suggestions;
  }

  buildTagSuggestion(tag, tagVal, id) {
    const snippets = [];
    let index = 0;

    function build(tag, {defaults}, snippets) {
      let attrs = '';
      if (defaults) {
        defaults.forEach((item, i) => {
          attrs += ` ${item}=$${index + i + 1}`;
        });
      }
      snippets.push(`${index > 0 ? '<':''}${tag}${attrs}$${index + (defaults ? defaults.length : 0)}>`);
      index++;
      snippets.push(`</${tag}>`);
    }

    build(tag, tagVal, snippets);

    return {
      label: tag,
      sortText: `0${id}${tag}`,
      insertText: new SnippetString(('<' + snippets.join('')).substr(1)),
      kind: CompletionItemKind.Snippet,
      detail: `Rax.js ${tagVal.version ? `(version: ${tagVal.version})` : ''}`,
      documentation: tagVal.description
    };
  }
  // #endregion tags intelliSense end
}
