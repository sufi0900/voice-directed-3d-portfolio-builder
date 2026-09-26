import React from 'react';
import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {RichDocumentView} from './rich-document-view';
import {DEFAULT_SITE_DOCUMENT} from '@/domain/site-document';
import {legacyRichDocument} from '@/domain/legacy-rich-document';
import {richNodeSchema} from '@/domain/rich-document';
describe('continuous content editor boundaries',()=>{
 it('renders headings, lists and code without executing raw markup or unsafe links',()=>{
  const node=richNodeSchema.parse({type:'doc',content:[{type:'heading',attrs:{level:3},content:[{type:'text',text:'Heading'}]},{type:'paragraph',content:[{type:'text',text:'Unsafe',marks:[{type:'link',attrs:{href:'javascript:alert(1)'}}]}]},{type:'codeBlock',content:[{type:'text',text:'<script>bad()</script>'}]}]});
  const html=renderToStaticMarkup(<RichDocumentView node={node} document={DEFAULT_SITE_DOCUMENT}/>);
  expect(html).toContain('<h3>Heading</h3>');expect(html).not.toContain('javascript:');expect(html).toContain('&lt;script&gt;');
 });
 it('converts legacy formatting and numbered lists without losing existing content',()=>{
  const node=legacyRichDocument({blocks:[{id:'a',type:'paragraph',text:'My **work** and [site](https://example.com)',items:[],headingLevel:'h2',mediaId:''},{id:'b',type:'ordered-list',text:'',items:['One','Two'],headingLevel:'h2',mediaId:''}]},DEFAULT_SITE_DOCUMENT);
  const html=renderToStaticMarkup(<RichDocumentView node={node} document={DEFAULT_SITE_DOCUMENT}/>);
  expect(html).toContain('<strong>work</strong>');expect(html).toContain('<ol>');expect(html).toContain('https://example.com');
 });
 it('strips editor-only link attributes so synchronization compares canonical content',()=>{
  const result=richNodeSchema.parse({type:'text',text:'Link',marks:[{type:'link',attrs:{href:'https://example.com',target:'_blank',class:'unused'}}]});
  expect(result.marks?.[0].attrs).toEqual({href:'https://example.com'});
 });
});
