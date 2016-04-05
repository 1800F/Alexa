import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import javax.crypto.*;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

public class NewCrypto
{


    private static Cipher enCipher = null;
    private static Cipher deCipher = null;
    private static byte baOurKey[] = null;
    private static IvParameterSpec ourIPS = null;
    private static SecretKey secretKey = null;

    public NewCrypto()
    {
    }

    public static String decryptCreditCard(String strCardNumber, String strKey)
    {
        String decryptedCard = null;
        try
        {
            if(strKey != null)
            {
                setKey(strKey.getBytes());
                byte iv[] = {
                    1, 35, 69, 103, -119, -85, -51, -17
                };
                setIV(iv);
                decryptedCard = convertBack(byteToHex(decrypt(hexToByte(strCardNumber))));
            }
        }
        catch(Exception ex)
        {
            return null;
        }
        return decryptedCard;
    }

    public static String encryptCreditCard(String strCardNumber, String strKey)
    {
        String decryptedCard = null;
        try
        {
            if(strKey != null)
            {
                setKey(strKey.getBytes());
                byte iv[] = {
                    1, 35, 69, 103, -119, -85, -51, -17
                };
                setIV(iv);
                decryptedCard = byteToHex(encrypt(hexToByte(convertSafe(strCardNumber))));
            }
        }
        catch(Exception ex)
        {
            return null;
        }
        return decryptedCard;
    }

    public static void main(String args[])
    {
     String encrytrecard = encryptCreditCard("411111111111111", "18F-SuperSekritSki11Inf!");
     System.out.println(encrytrecard);


 //String encrytrecard="B5E2DB015B587FD2";//
                           //

     //
     //

  String decrytrecard = decryptCreditCard(encrytrecard, "18F-SuperSekritSki11Inf!");
   System.out.println(decrytrecard);
   //
   //

    }




    private static boolean init()
    {
        boolean bRet = true;
        try
        {
            secretKey = new SecretKeySpec(baOurKey, "DESede");
            enCipher = Cipher.getInstance("DESede/CBC/NoPadding");
            deCipher = Cipher.getInstance("DESede/CBC/NoPadding");
        }
        catch(Exception ex)
        {
            bRet = false;
        }
        return bRet;
    }

    public static byte[] encrypt(byte plainText[])
    {
        if(secretKey == null && !init())
        {
            return null;
        }
        byte byteCipherText[] = (byte[])null;
        try
        {
            enCipher.init(1, secretKey, ourIPS);
            byteCipherText = enCipher.doFinal(plainText);
        }
        catch(InvalidKeyException invalidKey)
        {
            System.err.println(" Invalid Key " + invalidKey);
        }
        catch(IllegalBlockSizeException illegalBlockSize)
        {
            System.err.println(" Illegal Bolck Size " + illegalBlockSize);
        }
        catch(InvalidAlgorithmParameterException illegalBlockSize)
        {
            System.err.println(" Invalid Algorithm Parameter " + illegalBlockSize);
        }
        catch(BadPaddingException illegalBlockSize)
        {
            System.err.println(" Bad Padding " + illegalBlockSize);
        }
        return byteCipherText;
    }

    public static byte[] decrypt(byte cipherText[])
    {
        if(secretKey == null && !init())
        {
            return null;
        }
        byte byteClearText[] = (byte[])null;
        try
        {
            deCipher.init(2, secretKey, ourIPS);
            byteClearText = deCipher.doFinal(cipherText);
        }
        catch(InvalidKeyException invalidKey)
        {
            System.err.println(" Invalid Key " + invalidKey);
        }
        catch(IllegalBlockSizeException illegalBlockSize)
        {
            System.err.println(" Illegal Bolck Size " + illegalBlockSize);
        }
        catch(InvalidAlgorithmParameterException illegalBlockSize)
        {
            System.err.println(" Invalid Algorithm Parameter " + illegalBlockSize);
        }
        catch(BadPaddingException illegalBlockSize)
        {
            System.err.println(" Bad Padding " + illegalBlockSize);
        }
        return byteClearText;
    }

    public static void setKey(byte baKey[])
    {
        baOurKey = baKey;
    }

    public static void setIV(byte baIV[])
    {
        ourIPS = new IvParameterSpec(baIV);
    }

    private static String byteToHex(byte in[])
    {
        byte ch = 0;
        if(in == null || in.length <= 0)
        {
            return null;
        }
        String pseudo[] = {
            "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
            "A", "B", "C", "D", "E", "F"
        };
        StringBuffer out = new StringBuffer(in.length * 2);
        for(int i = 0; i < in.length; i++)
        {
            ch = (byte)(in[i] & 0xf0);
            ch >>>= 4;
            ch &= 0xf;
            out.append(pseudo[ch]);
            ch = (byte)(in[i] & 0xf);
            out.append(pseudo[ch]);
        }

        String rslt = new String(out);
        return rslt;
    }

    private static byte[] hexToByte(String creditCardData)
    {
        byte creditCardByte[] = creditCardData.getBytes();
        byte creditCardByteOut[] = new byte[8];
        int tempCnt = 0;
        for(int cnt = 0; cnt < creditCardData.length(); cnt += 2)
        {
            creditCardByte[cnt] = (byte)(creditCardByte[cnt] - (creditCardByte[cnt] >= 58 ? 55 : 48));
            creditCardByte[cnt + 1] = (byte)(creditCardByte[cnt + 1] - (creditCardByte[cnt + 1] >= 58 ? 55 : 48));
            creditCardByteOut[tempCnt++] = (byte)((creditCardByte[cnt] << 4) + creditCardByte[cnt + 1]);
        }

        return creditCardByteOut;
    }

    private static String convertSafe(String creditCardData)
    {
        if(creditCardData.length() < 16)
        {
            creditCardData = creditCardData + "BBBBBBBBBBBBBBBBBBBBB";
        }
        creditCardData = creditCardData.substring(0, 16);
        return creditCardData.replace('0', 'A');
    }

    private static String convertBack(String in)
    {
        return in.replace('A', '0').replace('B', ' ').trim();
    }

}

