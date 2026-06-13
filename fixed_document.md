python : Traceback (most recent call last):
所在位置 行:1 字符: 1
+ python fix_comprehensive.py 2>&1 | Out-String | Set-Content fixed_doc ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (Traceback (most recent call last) 
   ::String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
  File "D:\PiMerchantFramework\fix_comprehensive.py", line 76, in <module>
    print(content)
    ~~~~~^^^^^^^^^
UnicodeEncodeError: 'gbk' codec can't encode character '\ufeff' in position 0: 
illegal multibyte sequence

