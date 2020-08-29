
/**
 * Write a description of class HelloWorld here.
 *
 * @author (your name)
 * @version (a version number or a date)
 */
import javax.swing.JOptionPane;
import java.util.Scanner;
public class HelloWorld
{
    
    public static void main(String[] args) {
        String name ;
        Scanner sn = new Scanner(System.in);
        System.out.print("Please put your name: ");
        name = sn.nextLine();
        JOptionPane.showMessageDialog(null,name);

        //JOptionPane.showMessageDialog(null,"Welcome");
        //System.out.println("Hello");
    }
}